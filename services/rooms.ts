import 'server-only';
import { randomUUID } from 'node:crypto';
import { CHARACTERS, fillChild, isCharacterId, roomExpiresAt, type CharacterId } from '@/lib/characters';
import { CHILD_AUDIO_ENABLED, KING_VOICE_ENABLED } from '@/lib/features';
import type { ReplyDelay, RoomMessageDTO } from '@/lib/royal';
import { deriveChildToken, hashToken, newToken, TOKEN_REGEX } from '@/lib/tokens';
import { prepareSpeechText, synthesizeKingVoice, voiceLimits, VoiceError } from '@/lib/voice';
import { publish, publishRefresh, type Audience } from '@/services/realtime';
import { RoomError } from '@/services/room-errors';
import { getRoomStore } from '@/services/room-store';
import type { MessageRecord } from '@/services/room-store/types';

export { RoomError };

export type Role = Audience;

export interface Room {
  id: string;
  childName: string;
  character: CharacterId;
}

// ── Salas ────────────────────────────────────────────────────────────────

export async function createRoom(
  input: { childName: string; characterId: CharacterId },
  creatorHash: string,
): Promise<{ childToken: string; parentToken: string }> {
  const parentToken = newToken();
  const childToken = deriveChildToken(parentToken);
  await getRoomStore().insertRoom({
    childTokenHash: hashToken(childToken),
    parentTokenHash: hashToken(parentToken),
    childName: input.childName,
    characterId: input.characterId,
    creatorHash,
    expiresAt: roomExpiresAt(CHARACTERS[input.characterId]).toISOString(),
  });
  return { childToken, parentToken };
}

/** Resuelve token → sala + rol. El token se compara por hash; nunca se guarda en claro. */
export async function findRoomByToken(token: string): Promise<{ room: Room; role: Role } | null> {
  if (!TOKEN_REGEX.test(token)) return null;
  const h = hashToken(token);
  const rec = await getRoomStore().findRoomByTokenHash(h);
  if (!rec || !isCharacterId(rec.characterId)) return null;
  return {
    room: { id: rec.id, childName: rec.childName, character: rec.characterId },
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
  const c = CHARACTERS[room.character];
  const rec = await getRoomStore().insertMessage({
    roomId: room.id,
    sender: 'system',
    kind: 'text',
    body: fillChild(c.busyAck, room.childName),
  });
  notify(room, rec);
}

export async function addChildText(room: Room, text: string): Promise<void> {
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
): Promise<void> {
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
    deliverAt: role === 'parent' && delayMinutes > 0 ? new Date(Date.now() + delayMinutes * 60_000).toISOString() : undefined,
  });
  notify(room, rec);
  if (role === 'child') await maybeAcknowledge(room);
}

export async function addChildVoice(room: Room, audio: Buffer, mime: string, seconds: number): Promise<void> {
  if (!CHILD_AUDIO_ENABLED) throw new RoomError('INVALID_FILE');
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
