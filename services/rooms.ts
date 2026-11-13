import 'server-only';
import { randomUUID } from 'node:crypto';
import { CHARACTERS, fillChild, isCharacterId, resolveCharacter, roomExpiresAt, type CharacterId } from '@/lib/characters';
import { CHILD_AUDIO_ENABLED, KING_VOICE_ENABLED } from '@/lib/features';
import type { ReplyDelay, RoomMessageDTO } from '@/lib/royal';
import { deriveChildToken, deriveParentToken, hashToken, newFamilySeed, newToken, TOKEN_REGEX } from '@/lib/tokens';
import { prepareSpeechText, synthesizeKingVoice, voiceLimits, VoiceError } from '@/lib/voice';
import { publish, publishRefresh, type Audience } from '@/services/realtime';
import { parseLocale, type Locale } from '@/lib/i18n';
import { RoomError } from '@/services/room-errors';
import { getRoomStore } from '@/services/room-store';
import type { MessageRecord } from '@/services/room-store/types';
import { paymentsEnabled, trialMs, TRIAL_WINDOW_DAYS, TRIALS_PER_CREATOR } from '@/lib/billing';
import { checkPass, checkPassById } from '@/services/passes';

export { RoomError };

export type Role = Audience;

export interface Room {
  id: string;
  childName: string;
  character: CharacterId;
  /** Solo el elfo: nombre que le puso la familia y si es chico ('m') o chica ('f'). */
  characterAlias: string | null;
  characterGender: string | null;
  /** Cuántas veces se ha cambiado el enlace del niño. */
  childLinkVersion: number;
  readingLevel: ReadingLevel;
  trialEndsAt: string | null;
  passId: string | null;
  /** Variante de idioma de la sala (la misma para los padres y para el niño). */
  locale: Locale;
  /** Huella de la familia (null = sala sin familia). */
  familyHash: string | null;
}

export type ReadingLevel = 'yes' | 'learning' | 'no';
const asReading = (v: string): ReadingLevel => (v === 'learning' || v === 'no' ? v : 'yes');

/** Estado de pago de la sala, tal como lo ven el panel y el niño. */
export interface RoomAccess {
  /** 'free' = sin límites (cobros apagados o sala antigua) · 'trial' = prueba · 'pass' = con pase. */
  plan: 'free' | 'trial' | 'pass';
  trialEndsAt: string | null;
  /** La prueba ha terminado y no hay pase: no se pueden enviar mensajes nuevos. */
  locked: boolean;
}

export function roomAccess(room: Room, now = Date.now()): RoomAccess {
  if (room.passId) return { plan: 'pass', trialEndsAt: null, locked: false };
  if (!room.trialEndsAt || !paymentsEnabled()) return { plan: 'free', trialEndsAt: null, locked: false };
  return { plan: 'trial', trialEndsAt: room.trialEndsAt, locked: Date.parse(room.trialEndsAt) <= now };
}

/** Bloquea mensajes nuevos cuando la prueba ha terminado (el niño puede seguir leyendo). */
function assertOpen(room: Room): void {
  if (roomAccess(room).locked) throw new RoomError('TRIAL_ENDED');
}

// ── Salas ────────────────────────────────────────────────────────────────

export async function createRoom(
  input: { childName: string; characterId: CharacterId; characterAlias?: string; characterGender?: 'm' | 'f'; readingLevel?: ReadingLevel; passToken?: string; locale?: Locale; familyToken?: string; familyName?: string },
  creatorHash: string,
): Promise<{ childToken: string; parentToken: string; familyToken: string; plan: RoomAccess['plan'] }> {
  const store = getRoomStore();
  // Familia: se reutiliza solo si ya existe (el servidor no deja elegir un enlace de familia a medida).
  let familyToken = newToken();
  let familyName: string | null = input.familyName?.trim() || null;
  let familyPassId: string | null = null;
  if (input.familyToken && TOKEN_REGEX.test(input.familyToken)) {
    const existing = await store.listRoomsByFamilyHash(hashToken(input.familyToken));
    if (existing.length > 0) {
      familyToken = input.familyToken;
      familyName = familyName ?? existing.find((x) => x.familyName)?.familyName ?? null;
      familyPassId = existing.find((x) => x.passId)?.passId ?? null;
    }
  }
  // Con un pase válido: sin límite. Si no, prueba gratis (con tope suave por dispositivo/conexión).
  let passId: string | null = null;
  let trialEndsAt: string | null = null;
  if (paymentsEnabled()) {
    const pass = input.passToken ? await checkPass(input.passToken) : null;
    if (pass?.state === 'ok' && pass.pass) passId = pass.pass.id;
    else if (familyPassId && (await checkPassById(familyPassId))) passId = familyPassId;
    else {
      const since = new Date(Date.now() - TRIAL_WINDOW_DAYS * 86_400_000).toISOString();
      if ((await store.countTrialRoomsByCreatorSince(creatorHash, since)) >= TRIALS_PER_CREATOR) throw new RoomError('TRIAL_USED');
      trialEndsAt = new Date(Date.now() + trialMs()).toISOString();
    }
  }
  const familySeed = newFamilySeed();
  const parentToken = deriveParentToken(familyToken, familySeed);
  const childToken = deriveChildToken(parentToken);
  await store.insertRoom({
    childTokenHash: hashToken(childToken),
    parentTokenHash: hashToken(parentToken),
    childName: input.childName,
    characterId: input.characterId,
    characterAlias: input.characterId === 'duende_chispa' ? (input.characterAlias ?? null) : null,
    characterGender: input.characterId === 'duende_chispa' ? (input.characterGender ?? null) : null,
    creatorHash,
    expiresAt: roomExpiresAt(CHARACTERS[input.characterId]).toISOString(),
    readingLevel: input.readingLevel ?? 'yes',
    locale: input.locale ?? 'es',
    trialEndsAt,
    passId,
    familyHash: hashToken(familyToken),
    familySeed,
    familyName,
  });
  return { childToken, parentToken, familyToken, plan: passId ? 'pass' : trialEndsAt ? 'trial' : 'free' };
}

/** Resuelve token → sala + rol. El token se compara por hash; nunca se guarda en claro. */
export async function findRoomByToken(token: string): Promise<{ room: Room; role: Role } | null> {
  if (!TOKEN_REGEX.test(token)) return null;
  const h = hashToken(token);
  const rec = await getRoomStore().findRoomByTokenHash(h);
  if (!rec || !isCharacterId(rec.characterId)) return null;
  return {
    room: { id: rec.id, childName: rec.childName, character: rec.characterId, characterAlias: rec.characterAlias, characterGender: rec.characterGender, childLinkVersion: rec.childLinkVersion, readingLevel: asReading(rec.readingLevel), trialEndsAt: rec.trialEndsAt, passId: rec.passId, locale: parseLocale(rec.locale) ?? 'es', familyHash: rec.familyHash },
    role: rec.childTokenHash === h ? 'child' : 'parent',
  };
}

// ── Lectura ──────────────────────────────────────────────────────────────

/** Versión del estado de la sala para el sondeo condicional. */
export async function getMessagesVersion(room: Room, role: Role): Promise<string> {
  return getRoomStore().getRoomVersion(room.id, { deliveredOnly: role === 'child' });
}

export async function listMessages(room: Room, role: Role): Promise<RoomMessageDTO[]> {
  const store = getRoomStore();
  const records = await store.listMessages(room.id, { deliveredOnly: role === 'child' });

  const [voiceUrls, mediaUrls] = await Promise.all([
    store.signedUrls('voices', records.flatMap((m) => (m.audioPath ? [m.audioPath] : []))),
    store.signedUrls('media', records.flatMap((m) => (m.imagePath ? [m.imagePath] : []))),
  ]);

  const now = Date.now();
  return records.map((m) => {
    const dto: RoomMessageDTO = { id: m.id, from: m.sender === 'king' ? 'king' : m.sender, kind: m.kind, at: m.deliverAt };
    if (m.audioPath) dto.audioUrl = voiceUrls.get(m.audioPath);
    if (m.imagePath) dto.imageUrl = mediaUrls.get(m.imagePath);
    if (m.effect) dto.effect = m.effect;
    if (m.durationS !== null) dto.duration = m.durationS;
    // El niño nunca ve el texto de las notas de voz del personaje (solo el audio).
    if (m.body && (role === 'parent' || m.kind !== 'voice')) dto.text = m.body;
    if (role === 'parent' && Date.parse(m.deliverAt) > now) dto.pending = true;
    return dto;
  });
}

// ── Validación de ficheros por firma de bytes ────────────────────────────

const AUDIO_TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  'audio/webm': { ext: 'webm', magic: (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
  'audio/mp4': { ext: 'mp4', magic: (b) => b.subarray(4, 8).toString('latin1') === 'ftyp' },
  'audio/x-m4a': { ext: 'm4a', magic: (b) => b.subarray(4, 8).toString('latin1') === 'ftyp' },
  'audio/ogg': { ext: 'ogg', magic: (b) => b.subarray(0, 4).toString('latin1') === 'OggS' },
};

const IMAGE_TYPES: Record<string, { ext: 'webp' | 'jpg'; magic: (b: Buffer) => boolean }> = {
  'image/webp': {
    ext: 'webp',
    magic: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
  'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
};

const baseMime = (mime: string) => mime.split(';')[0]?.trim().toLowerCase() ?? '';
export const normalizeAudioType = (mime: string) => (baseMime(mime) in AUDIO_TYPES ? baseMime(mime) : null);
export const normalizeImageType = (mime: string) => (baseMime(mime) in IMAGE_TYPES ? baseMime(mime) : null);

// ── Escritura ────────────────────────────────────────────────────────────

/** Notifica a los conectados y deja constancia del retraso si lo hay. */
function notify(room: Room, rec: MessageRecord): void {
  publishRefresh(room.id, rec.deliverAt);
}

/** Acuse automático en la voz del personaje ("he recibido tu mensaje…"). Máximo uno cada 15 min. */
async function maybeAcknowledge(room: Room): Promise<void> {
  const since = new Date(Date.now() - 15 * 60_000).toISOString();
  if ((await getRoomStore().countSystemMessagesSince(room.id, since)) > 0) return;
  const c = resolveCharacter(CHARACTERS[room.character], { alias: room.characterAlias, gender: room.characterGender, locale: room.locale });
  const rec = await getRoomStore().insertMessage({
    roomId: room.id,
    sender: 'system',
    kind: 'text',
    body: fillChild(c.busyAck, room.childName),
  });
  notify(room, rec);
}

export async function addChildText(room: Room, text: string): Promise<void> {
  assertOpen(room);
  const rec = await getRoomStore().insertMessage({ roomId: room.id, sender: 'child', kind: 'text', body: text });
  notify(room, rec);
  await maybeAcknowledge(room);
}

export async function addPhoto(
  room: Room,
  role: Role,
  image: Buffer,
  mime: string,
  caption: string | null,
  delayMinutes: ReplyDelay = 0,
  scheduledAt?: string,
): Promise<void> {
  assertOpen(room);
  const type = normalizeImageType(mime);
  const spec = type ? IMAGE_TYPES[type] : undefined;
  if (!type || !spec || !spec.magic(image)) throw new RoomError('INVALID_FILE');

  const path = `${room.id}/${randomUUID()}.${spec.ext}`;
  const store = getRoomStore();
  await store.uploadFile('media', path, image, type);
  const rec = await store.insertMessage({
    roomId: room.id,
    sender: role === 'child' ? 'child' : 'king',
    kind: 'photo',
    imagePath: path,
    body: caption,
    deliverAt:
      role === 'parent' ? (scheduledAt ?? (delayMinutes > 0 ? new Date(Date.now() + delayMinutes * 60_000).toISOString() : undefined)) : undefined,
  });
  notify(room, rec);
  if (role === 'child') await maybeAcknowledge(room);
}

export async function addChildVoice(room: Room, audio: Buffer, mime: string, seconds: number): Promise<void> {
  if (!CHILD_AUDIO_ENABLED) throw new RoomError('INVALID_FILE');
  assertOpen(room);
  const type = normalizeAudioType(mime);
  const spec = type ? AUDIO_TYPES[type] : undefined;
  if (!type || !spec || !spec.magic(audio)) throw new RoomError('INVALID_FILE');

  const path = `${room.id}/${randomUUID()}.${spec.ext}`;
  const store = getRoomStore();
  await store.uploadFile('voices', path, audio, type);
  const rec = await store.insertMessage({ roomId: room.id, sender: 'child', kind: 'voice', audioPath: path, durationS: seconds });
  notify(room, rec);
  await maybeAcknowledge(room);
}

export interface ReplyOutcome {
  delivered: 'voice' | 'text';
  /** Si se pidió voz y se entregó por escrito, por qué. */
  fallback?: 'limit' | 'unavailable';
}

export async function addKingReply(
  room: Room,
  text: string,
  delayMinutes: ReplyDelay,
  mode: 'voice' | 'text' = 'text',
  effect?: 'surprise',
  /** Entrega programada (ISO). Si va, sustituye al retraso en minutos. */
  scheduledAt?: string,
): Promise<ReplyOutcome> {
  assertOpen(room);
  const store = getRoomStore();
  const deliverAt = scheduledAt ?? new Date(Date.now() + delayMinutes * 60_000).toISOString();

  const sendText = async (fallback?: ReplyOutcome['fallback']): Promise<ReplyOutcome> => {
    const rec = await store.insertMessage({ roomId: room.id, sender: 'king', kind: 'text', body: text, effect: effect ?? null, deliverAt });
    notify(room, rec);
    return fallback ? { delivered: 'text', fallback } : { delivered: 'text' };
  };

  // La sorpresa siempre va por escrito (la pantalla especial muestra el texto).
  if (mode === 'text' || !KING_VOICE_ENABLED || effect === 'surprise') return sendText();
  if (!prepareSpeechText(text)) return sendText();

  // Topes de coste: por sala y diario global. Si se superan, se entrega por escrito.
  const limits = voiceLimits();
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const [roomReplies, totalChars] = await Promise.all([store.countVoiceRepliesSince(room.id, since), store.sumVoiceCharsSince(since)]);
  if (roomReplies >= limits.roomDailyReplies || totalChars + text.length > limits.dailyChars) return sendText('limit');

  let synth: Awaited<ReturnType<typeof synthesizeKingVoice>>;
  try {
    synth = await synthesizeKingVoice(room.character, text);
  } catch (err) {
    console.error('[voice]', err instanceof VoiceError ? err.message : err);
    return sendText(err instanceof VoiceError && err.kind === 'quota' ? 'limit' : 'unavailable');
  }
  const { audio, seconds } = synth;
  const path = `${room.id}/${randomUUID()}.mp3`;
  await store.uploadFile('voices', path, audio, 'audio/mpeg');
  const rec = await store.insertMessage({
    roomId: room.id,
    sender: 'king',
    kind: 'voice',
    body: text,
    audioPath: path,
    durationS: Math.min(120, seconds),
    deliverAt,
  });
  notify(room, rec);
  return { delivered: 'voice' };
}

/** Cancela un mensaje programado que aún no se ha entregado. */
export async function cancelPending(room: Room, messageId: string): Promise<boolean> {
  const ok = await getRoomStore().deletePendingMessage(room.id, messageId, new Date().toISOString());
  if (ok) publishRefresh(room.id);
  return ok;
}

/** "Escribiendo…" en vivo hacia el otro lado. No se guarda. */
export function signalTyping(room: Room, from: Role): void {
  publish(room.id, { type: 'typing', from }, from === 'parent' ? 'child' : 'parent');
}

/**
 * Borra un mensaje de la sala (lo hacen los padres si hay un error). Desaparece también
 * para el niño en su próxima actualización, y se borran sus audios o fotos del almacén.
 */
export async function eraseMessage(room: Room, messageId: string): Promise<boolean> {
  const store = getRoomStore();
  const row = await store.deleteMessage(room.id, messageId);
  if (!row) return false;
  if (row.audioPath) await store.removeFile('voices', row.audioPath).catch(() => undefined);
  if (row.imagePath) await store.removeFile('media', row.imagePath).catch(() => undefined);
  publishRefresh(room.id);
  return true;
}

/** Cambia el texto de un mensaje del personaje (solo texto o pie de foto, nunca audios). */
export async function editMessage(room: Room, messageId: string, text: string): Promise<'ok' | 'not_found' | 'invalid'> {
  const store = getRoomStore();
  const rec = await store.getMessage(room.id, messageId);
  if (!rec || rec.sender !== 'king' || (rec.kind !== 'text' && rec.kind !== 'photo')) return 'not_found';
  if (rec.kind === 'text' && !text) return 'invalid';
  const updated = await store.updateMessageBody(room.id, messageId, text || null, new Date().toISOString());
  if (!updated) return 'not_found';
  publishRefresh(room.id);
  return 'ok';
}

/** Cambia el nombre y/o el personaje de la sala. El niño lo verá al volver a abrir su enlace. */
export async function editRoom(
  room: Room,
  patch: { childName?: string; characterId?: CharacterId; characterAlias?: string; characterGender?: 'm' | 'f'; readingLevel?: ReadingLevel },
): Promise<boolean> {
  const { readingLevel, ...rest } = patch;
  const store = getRoomStore();
  let ok = true;
  if (Object.keys(rest).length > 0) ok = await store.updateRoom(room.id, rest);
  if (readingLevel) ok = (await store.updateReadingLevel(room.id, readingLevel)) && ok;
  if (ok) publishRefresh(room.id);
  return ok;
}

/**
 * Borra la sala por completo: mensajes, audios y fotos. Es irreversible.
 * El niño verá "esta sala ya no existe" en su siguiente actualización.
 */
export async function eraseRoom(room: Room): Promise<void> {
  const store = getRoomStore();
  for (const f of await store.listFilePaths(room.id)) {
    await store.removeFile(f.bucket, f.path).catch(() => undefined);
  }
  await store.deleteRoom(room.id);
  publishRefresh(room.id);
}

/**
 * Cambia el enlace del niño: el anterior deja de funcionar y se genera otro, derivado del de los padres.
 * Devuelve el nuevo token del niño para que los padres lo compartan.
 */
export async function rotateChildLink(room: Room, parentToken: string): Promise<string> {
  const version = room.childLinkVersion + 1;
  const childToken = deriveChildToken(parentToken, version);
  const ok = await getRoomStore().updateChildLink(room.id, version, hashToken(childToken));
  if (!ok) throw new RoomError('NOT_FOUND');
  // Si el niño tenía la sala abierta, en su próxima actualización verá que el enlace ya no vale.
  publishRefresh(room.id);
  return childToken;
}

// ── Familias ─────────────────────────────────────────────────────────────

export interface FamilyRoomView {
  childName: string;
  character: CharacterId;
  characterAlias: string | null;
  characterGender: string | null;
  locale: Locale;
  readingLevel: ReadingLevel;
  /** Enlaces secretos reconstruidos desde el enlace de familia. */
  parentToken: string;
  childToken: string;
  expiresAt: string;
  access: RoomAccess;
}

export interface FamilyView {
  name: string | null;
  rooms: FamilyRoomView[];
}

/** Reconstruye todas las salas de una familia a partir de su enlace. null si no existe o ha caducado. */
export async function getFamily(familyToken: string): Promise<FamilyView | null> {
  if (!TOKEN_REGEX.test(familyToken)) return null;
  const recs = await getRoomStore().listRoomsByFamilyHash(hashToken(familyToken));
  const rooms: FamilyRoomView[] = [];
  for (const rec of recs) {
    if (!rec.familySeed || !isCharacterId(rec.characterId)) continue;
    const parentToken = deriveParentToken(familyToken, rec.familySeed);
    // Defensa: el enlace reconstruido tiene que coincidir con la huella guardada.
    if (hashToken(parentToken) !== rec.parentTokenHash) continue;
    const room: Room = {
      id: rec.id, childName: rec.childName, character: rec.characterId, characterAlias: rec.characterAlias, characterGender: rec.characterGender,
      childLinkVersion: rec.childLinkVersion, readingLevel: asReading(rec.readingLevel), trialEndsAt: rec.trialEndsAt, passId: rec.passId,
      locale: parseLocale(rec.locale) ?? 'es', familyHash: rec.familyHash,
    };
    rooms.push({
      childName: rec.childName,
      character: rec.characterId,
      characterAlias: rec.characterAlias,
      characterGender: rec.characterGender,
      locale: room.locale,
      readingLevel: room.readingLevel,
      parentToken,
      childToken: deriveChildToken(parentToken, rec.childLinkVersion),
      expiresAt: rec.expiresAt,
      access: roomAccess(room),
    });
  }
  if (rooms.length === 0) return null;
  return { name: recs.find((r) => r.familyName)?.familyName ?? null, rooms };
}

/** Cambia el apodo de la familia (se ve dentro de la página de familia, nunca en la dirección). */
export async function renameFamily(familyToken: string, name: string | null): Promise<boolean> {
  if (!TOKEN_REGEX.test(familyToken)) return false;
  const hash = hashToken(familyToken);
  if ((await getRoomStore().listRoomsByFamilyHash(hash)).length === 0) return false;
  await getRoomStore().updateFamilyName(hash, name);
  return true;
}
