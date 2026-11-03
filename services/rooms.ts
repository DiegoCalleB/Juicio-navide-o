import 'server-only';
import { randomUUID } from 'node:crypto';
import { getAdminClient } from '@/lib/supabase/admin';
import { deriveChildToken, hashToken, newToken, TOKEN_REGEX } from '@/lib/tokens';
import { synthesizeKingVoice } from '@/lib/voice';
import { KINGS, type KingId, type ReplyDelay, type RoomMessageDTO } from '@/lib/royal';

const BUCKET = 'voices';
const SIGNED_URL_TTL = 60 * 60;

export type Role = 'child' | 'parent';

export interface Room {
  id: string;
  childName: string;
  king: KingId;
}

interface RoomRow {
  id: string;
  child_name: string;
  king: KingId;
  child_token_hash: string;
  parent_token_hash: string;
}

interface MessageRow {
  id: string;
  sender: 'child' | 'king' | 'system';
  kind: 'text' | 'voice';
  body: string | null;
  audio_path: string | null;
  duration_s: number | null;
  deliver_at: string;
}

export class RoomError extends Error {
  constructor(public readonly code: 'RATE_LIMITED' | 'NOT_FOUND' | 'UNKNOWN') {
    super(code);
  }
}

function isRateLimit(err: { message: string } | null): boolean {
  return !!err && err.message.includes('RATE_LIMIT');
}

export async function createRoom(
  input: { childName: string; king: KingId },
  creatorHash: string,
): Promise<{ childToken: string; parentToken: string }> {
  const parentToken = newToken();
  const childToken = deriveChildToken(parentToken);
  const { error } = await getAdminClient().from('rooms').insert({
    child_token_hash: hashToken(childToken),
    parent_token_hash: hashToken(parentToken),
    child_name: input.childName,
    king: input.king,
    creator_hash: creatorHash,
  });
  if (isRateLimit(error)) throw new RoomError('RATE_LIMITED');
  if (error) throw new Error(`createRoom: ${error.message}`);
  return { childToken, parentToken };
}

/** Resuelve token → sala + rol. El token se compara por hash; nunca se guarda en claro. */
export async function findRoomByToken(token: string): Promise<{ room: Room; role: Role } | null> {
  if (!TOKEN_REGEX.test(token)) return null;
  const h = hashToken(token);
  const { data, error } = await getAdminClient()
    .from('rooms')
    .select('id, child_name, king, child_token_hash, parent_token_hash')
    .or(`child_token_hash.eq.${h},parent_token_hash.eq.${h}`)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle<RoomRow>();
  if (error || !data) return null;
  return {
    room: { id: data.id, childName: data.child_name, king: data.king },
    role: data.child_token_hash === h ? 'child' : 'parent',
  };
}

export async function listMessages(room: Room, role: Role): Promise<RoomMessageDTO[]> {
  const db = getAdminClient();
  let q = db
    .from('room_messages')
    .select('id, sender, kind, body, audio_path, duration_s, deliver_at')
    .eq('room_id', room.id)
    .order('deliver_at', { ascending: true })
    .limit(200);
  if (role === 'child') q = q.lte('deliver_at', new Date().toISOString());
  const { data, error } = await q.returns<MessageRow[]>();
  if (error || !data) throw new Error(`listMessages: ${error?.message ?? 'sin datos'}`);

  const paths = data.flatMap((m) => (m.audio_path ? [m.audio_path] : []));
  const urls = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await db.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }

  const now = Date.now();
  return data.map((m) => {
    const dto: RoomMessageDTO = { id: m.id, from: m.sender, kind: m.kind, at: m.deliver_at };
    if (m.audio_path) dto.audioUrl = urls.get(m.audio_path);
    if (m.duration_s !== null) dto.duration = Number(m.duration_s);
    // El niño nunca ve el texto de las notas de voz del Rey (solo el audio).
    if (m.body && (role === 'parent' || m.kind === 'text')) dto.text = m.body;
    if (role === 'parent' && Date.parse(m.deliver_at) > now) dto.pending = true;
    return dto;
  });
}

const AUDIO_TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  'audio/webm': { ext: 'webm', magic: (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
  'audio/mp4': { ext: 'mp4', magic: (b) => b.subarray(4, 8).toString('latin1') === 'ftyp' },
  'audio/x-m4a': { ext: 'm4a', magic: (b) => b.subarray(4, 8).toString('latin1') === 'ftyp' },
  'audio/ogg': { ext: 'ogg', magic: (b) => b.subarray(0, 4).toString('latin1') === 'OggS' },
};

export function normalizeAudioType(mime: string): string | null {
  const base = mime.split(';')[0]?.trim().toLowerCase() ?? '';
  return base in AUDIO_TYPES ? base : null;
}

async function insertMessage(row: Record<string, unknown>): Promise<void> {
  const { error } = await getAdminClient().from('room_messages').insert(row);
  if (isRateLimit(error)) throw new RoomError('RATE_LIMITED');
  if (error) throw new Error(`insertMessage: ${error.message}`);
}

/** Acuse automático: "los Reyes están muy ocupados". Máximo uno cada 15 min. */
async function maybeAcknowledge(room: Room): Promise<void> {
  const since = new Date(Date.now() - 15 * 60_000).toISOString();
  const { count } = await getAdminClient()
    .from('room_messages')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id)
    .eq('sender', 'system')
    .gte('created_at', since);
  if ((count ?? 0) > 0) return;
  const king = KINGS[room.king].name.replace('Rey ', '');
  await insertMessage({
    room_id: room.id,
    sender: 'system',
    kind: 'text',
    body: `Tu mensaje ya vuela hacia Oriente ✨ Los Reyes están muy ocupados preparando los regalos. ¡${king} te contestará pronto!`,
  });
}

export async function addChildVoice(room: Room, audio: Buffer, mime: string, seconds: number): Promise<void> {
  const type = normalizeAudioType(mime);
  const spec = type ? AUDIO_TYPES[type] : undefined;
  if (!type || !spec || !spec.magic(audio)) throw new Error('Formato de audio no válido');

  const path = `${room.id}/${randomUUID()}.${spec.ext}`;
  const { error } = await getAdminClient()
    .storage.from(BUCKET)
    .upload(path, audio, { contentType: type, upsert: false });
  if (error) throw new Error(`upload: ${error.message}`);

  await insertMessage({ room_id: room.id, sender: 'child', kind: 'voice', audio_path: path, duration_s: seconds });
  await maybeAcknowledge(room);
}

export async function addChildText(room: Room, text: string): Promise<void> {
  await insertMessage({ room_id: room.id, sender: 'child', kind: 'text', body: text });
  await maybeAcknowledge(room);
}

export async function addKingReply(
  room: Room,
  text: string,
  delayMinutes: ReplyDelay,
  mode: 'voice' | 'text' = 'voice',
): Promise<void> {
  const deliverAt = new Date(Date.now() + delayMinutes * 60_000).toISOString();
  if (mode === 'text') {
    await insertMessage({ room_id: room.id, sender: 'king', kind: 'text', body: text, deliver_at: deliverAt });
    return;
  }
  const { audio, seconds } = await synthesizeKingVoice(room.king, text);
  const path = `${room.id}/${randomUUID()}.mp3`;
  const { error } = await getAdminClient()
    .storage.from(BUCKET)
    .upload(path, audio, { contentType: 'audio/mpeg', upsert: false });
  if (error) throw new Error(`upload: ${error.message}`);

  await insertMessage({
    room_id: room.id,
    sender: 'king',
    kind: 'voice',
    body: text,
    audio_path: path,
    duration_s: Math.min(120, seconds),
    deliver_at: deliverAt,
  });
}
