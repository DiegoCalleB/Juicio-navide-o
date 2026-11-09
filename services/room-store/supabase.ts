import 'server-only';
import { getAdminClient } from '@/lib/supabase/admin';
import { RoomError } from '@/services/room-errors';
import type { Bucket, MessageRecord, NewMessage, NewRoom, RoomRecord, RoomStore } from './types';

const SIGNED_URL_TTL = 60 * 60;
const BUCKETS: Bucket[] = ['voices', 'media'];

interface MessageRow {
  id: string;
  room_id: string;
  sender: MessageRecord['sender'];
  kind: MessageRecord['kind'];
  body: string | null;
  audio_path: string | null;
  image_path: string | null;
  duration_s: number | null;
  effect: 'surprise' | null;
  deliver_at: string;
  created_at: string;
  edited_at: string | null;
}

const MESSAGE_COLUMNS = 'id, room_id, sender, kind, body, audio_path, image_path, duration_s, effect, deliver_at, created_at, edited_at';

const isRateLimit = (err: { message: string } | null) => !!err && err.message.includes('RATE_LIMIT');

const toRecord = (r: MessageRow): MessageRecord => ({
  id: r.id,
  roomId: r.room_id,
  sender: r.sender,
  kind: r.kind,
  body: r.body,
  audioPath: r.audio_path,
  imagePath: r.image_path,
  durationS: r.duration_s === null ? null : Number(r.duration_s),
  effect: r.effect,
  deliverAt: r.deliver_at,
  createdAt: r.created_at,
  editedAt: r.edited_at,
});

/** URLs firmadas en caché: evitan llamar a Storage en cada cambio (caducan a los 50 min; el TTL real es 60). */
const URL_CACHE_MS = 50 * 60_000;
const URL_CACHE_MAX = 5000;
const g = globalThis as unknown as { __signedUrlCache?: Map<string, { url: string; exp: number }> };
const urlCache = () => (g.__signedUrlCache ??= new Map());

export class SupabaseRoomStore implements RoomStore {
  async insertRoom(room: NewRoom): Promise<void> {
    const { error } = await getAdminClient().from('rooms').insert({
      child_token_hash: room.childTokenHash,
      parent_token_hash: room.parentTokenHash,
      child_name: room.childName,
      character_id: room.characterId,
      creator_hash: room.creatorHash,
      expires_at: room.expiresAt,
    });
    if (isRateLimit(error)) throw new RoomError('RATE_LIMITED');
    if (error) throw new Error(`insertRoom: ${error.message}`);
  }

  async findRoomByTokenHash(hash: string): Promise<RoomRecord | null> {
    const { data, error } = await getAdminClient()
      .from('rooms')
      .select('id, child_name, character_id, child_token_hash, parent_token_hash')
      .or(`child_token_hash.eq.${hash},parent_token_hash.eq.${hash}`)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle<{ id: string; child_name: string; character_id: string; child_token_hash: string; parent_token_hash: string }>();
    if (error || !data) return null;
    return {
      id: data.id,
      childName: data.child_name,
      characterId: data.character_id,
      childTokenHash: data.child_token_hash,
      parentTokenHash: data.parent_token_hash,
    };
  }

  async insertMessage(m: NewMessage): Promise<MessageRecord> {
    const row: Record<string, unknown> = {
      room_id: m.roomId,
      sender: m.sender,
      kind: m.kind,
      body: m.body ?? null,
      audio_path: m.audioPath ?? null,
      image_path: m.imagePath ?? null,
      duration_s: m.durationS ?? null,
      effect: m.effect ?? null,
    };
    if (m.deliverAt) row.deliver_at = m.deliverAt;
    const { data, error } = await getAdminClient()
      .from('room_messages')
      .insert(row)
      .select(MESSAGE_COLUMNS)
      .single<MessageRow>();
    if (isRateLimit(error)) throw new RoomError('RATE_LIMITED');
    if (error || !data) throw new Error(`insertMessage: ${error?.message ?? 'sin datos'}`);
    return toRecord(data);
  }

  async listMessages(roomId: string, opts: { deliveredOnly: boolean }): Promise<MessageRecord[]> {
    let q = getAdminClient()
      .from('room_messages')
      .select(MESSAGE_COLUMNS)
      .eq('room_id', roomId)
      .order('deliver_at', { ascending: true })
      .limit(200);
    if (opts.deliveredOnly) q = q.lte('deliver_at', new Date().toISOString());
    const { data, error } = await q.returns<MessageRow[]>();
    if (error || !data) throw new Error(`listMessages: ${error?.message ?? 'sin datos'}`);
    return data.map(toRecord);
  }

  async getRoomVersion(roomId: string, opts: { deliveredOnly: boolean }): Promise<string> {
    const db = getAdminClient();
    const nowIso = new Date().toISOString();
    const base = () => db.from('room_messages').select('id', { count: 'exact', head: true }).eq('room_id', roomId);
    const [total, delivered, latest] = await Promise.all([
      opts.deliveredOnly ? base().lte('deliver_at', nowIso) : base(),
      base().lte('deliver_at', nowIso),
      db.from('room_messages').select('id').eq('room_id', roomId).order('created_at', { ascending: false }).limit(1).maybeSingle<{ id: string }>(),
    ]);
    const edited = await db
      .from('room_messages')
      .select('edited_at')
      .eq('room_id', roomId)
      .not('edited_at', 'is', null)
      .order('edited_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ edited_at: string }>();
    return `${total.count ?? 0}.${delivered.count ?? 0}.${latest.data?.id ?? '-'}.${edited.data?.edited_at ?? '-'}`;
  }

  async countSystemMessagesSince(roomId: string, sinceIso: string): Promise<number> {
    const { count } = await getAdminClient()
      .from('room_messages')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('sender', 'system')
      .gte('created_at', sinceIso);
    return count ?? 0;
  }

  async deleteMessage(roomId: string, messageId: string): Promise<MessageRecord | null> {
    const { data, error } = await getAdminClient()
      .from('room_messages')
      .delete()
      .eq('id', messageId)
      .eq('room_id', roomId)
      .select(MESSAGE_COLUMNS)
      .maybeSingle<MessageRow>();
    if (error) throw new Error('No se pudo borrar el mensaje.');
    return data ? toRecord(data) : null;
  }

  async removeFile(bucket: Bucket, path: string): Promise<void> {
    const { error } = await getAdminClient().storage.from(bucket).remove([path]);
    if (error) throw new Error(`removeFile: ${error.message}`);
  }

  async getMessage(roomId: string, messageId: string): Promise<MessageRecord | null> {
    const { data, error } = await getAdminClient()
      .from('room_messages')
      .select(MESSAGE_COLUMNS)
      .eq('id', messageId)
      .eq('room_id', roomId)
      .maybeSingle<MessageRow>();
    if (error) throw new Error('No se pudo leer el mensaje.');
    return data ? toRecord(data) : null;
  }

  async updateMessageBody(roomId: string, messageId: string, body: string | null, nowIso: string): Promise<MessageRecord | null> {
    const { data, error } = await getAdminClient()
      .from('room_messages')
      .update({ body, edited_at: nowIso })
      .eq('id', messageId)
      .eq('room_id', roomId)
      .eq('sender', 'king')
      .in('kind', ['text', 'photo'])
      .select(MESSAGE_COLUMNS)
      .maybeSingle<MessageRow>();
    if (error) throw new Error('No se pudo editar el mensaje.');
    return data ? toRecord(data) : null;
  }

  async updateRoom(roomId: string, patch: { childName?: string; characterId?: string }): Promise<boolean> {
    const update: Record<string, string> = {};
    if (patch.childName !== undefined) update.child_name = patch.childName;
    if (patch.characterId !== undefined) update.character_id = patch.characterId;
    const { data, error } = await getAdminClient().from('rooms').update(update).eq('id', roomId).select('id');
    if (error) throw new Error('No se pudo editar la sala.');
    return (data?.length ?? 0) > 0;
  }

  async listFilePaths(roomId: string): Promise<{ bucket: Bucket; path: string }[]> {
    const { data, error } = await getAdminClient().from('room_messages').select('audio_path, image_path').eq('room_id', roomId);
    if (error) throw new Error('No se pudieron listar los archivos.');
    const out: { bucket: Bucket; path: string }[] = [];
    for (const r of (data ?? []) as { audio_path: string | null; image_path: string | null }[]) {
      if (r.audio_path) out.push({ bucket: 'voices', path: r.audio_path });
      if (r.image_path) out.push({ bucket: 'media', path: r.image_path });
    }
    return out;
  }

  async deleteRoom(roomId: string): Promise<void> {
    const { error } = await getAdminClient().from('rooms').delete().eq('id', roomId);
    if (error) throw new Error('No se pudo borrar la sala.');
  }

  async deletePendingMessage(roomId: string, messageId: string, nowIso: string): Promise<boolean> {
    const { data, error } = await getAdminClient()
      .from('room_messages')
      .delete()
      .eq('id', messageId)
      .eq('room_id', roomId)
      .eq('sender', 'king')
      .gt('deliver_at', nowIso)
      .select('id');
    if (error) throw new Error('No se pudo cancelar el mensaje.');
    return (data?.length ?? 0) > 0;
  }

  async countVoiceRepliesSince(roomId: string, sinceIso: string): Promise<number> {
    const { count } = await getAdminClient()
      .from('room_messages')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('sender', 'king')
      .eq('kind', 'voice')
      .gte('created_at', sinceIso);
    return count ?? 0;
  }

  async sumVoiceCharsSince(sinceIso: string): Promise<number> {
    const { data } = await getAdminClient()
      .from('room_messages')
      .select('body')
      .eq('sender', 'king')
      .eq('kind', 'voice')
      .gte('created_at', sinceIso)
      .limit(20000)
      .returns<{ body: string | null }[]>();
    return (data ?? []).reduce((sum, r) => sum + (r.body?.length ?? 0), 0);
  }

  async uploadFile(bucket: Bucket, path: string, data: Buffer, contentType: string): Promise<void> {
    const { error } = await getAdminClient().storage.from(bucket).upload(path, data, { contentType, upsert: false });
    if (error) throw new Error(`upload: ${error.message}`);
  }

  async signedUrls(bucket: Bucket, paths: string[]): Promise<Map<string, string>> {
    const urls = new Map<string, string>();
    if (paths.length === 0) return urls;
    const cache = urlCache();
    const now = Date.now();
    const missing: string[] = [];
    for (const p of paths) {
      const hit = cache.get(`${bucket}/${p}`);
      if (hit && hit.exp > now) urls.set(p, hit.url);
      else missing.push(p);
    }
    if (missing.length > 0) {
      const { data } = await getAdminClient().storage.from(bucket).createSignedUrls(missing, SIGNED_URL_TTL);
      for (const s of data ?? []) {
        if (!s.path || !s.signedUrl) continue;
        urls.set(s.path, s.signedUrl);
        cache.set(`${bucket}/${s.path}`, { url: s.signedUrl, exp: now + URL_CACHE_MS });
      }
      if (cache.size > URL_CACHE_MAX) for (const [k, v] of cache) if (v.exp <= now) cache.delete(k);
    }
    return urls;
  }

  async deleteExpired(nowIso: string): Promise<{ rooms: number; files: number }> {
    const db = getAdminClient();
    const { data: expired, error } = await db.from('rooms').select('id').lt('expires_at', nowIso).limit(200);
    if (error) throw new Error(`deleteExpired: ${error.message}`);
    let files = 0;
    for (const { id } of expired ?? []) {
      for (const bucket of BUCKETS) {
        const { data: list } = await db.storage.from(bucket).list(id, { limit: 1000 });
        const paths = (list ?? []).map((f) => `${id}/${f.name}`);
        if (paths.length > 0) {
          const { error: rmErr } = await db.storage.from(bucket).remove(paths);
          if (rmErr) throw new Error(`deleteExpired storage: ${rmErr.message}`);
          files += paths.length;
        }
      }
      const { error: delErr } = await db.from('rooms').delete().eq('id', id);
      if (delErr) throw new Error(`deleteExpired room: ${delErr.message}`);
    }
    return { rooms: expired?.length ?? 0, files };
  }
}
