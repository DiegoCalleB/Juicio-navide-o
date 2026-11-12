import 'server-only';
import { getAdminClient } from '@/lib/supabase/admin';
import { RoomError } from '@/services/room-errors';
import type { Bucket, MessageRecord, NewMessage, NewPass, NewRoom, PassRecord, RoomRecord, RoomStore } from './types';

interface PassRow {
  id: string;
  kind: 'paid' | 'gift';
  stripe_session_id: string | null;
  parent_pass_id: string | null;
  rooms_limit: number;
  expires_at: string;
}
const PASS_COLUMNS = 'id, kind, stripe_session_id, parent_pass_id, rooms_limit, expires_at';
const toPass = (r: PassRow): PassRecord => ({
  id: r.id,
  kind: r.kind,
  stripeSessionId: r.stripe_session_id,
  parentPassId: r.parent_pass_id,
  roomsLimit: r.rooms_limit,
  expiresAt: r.expires_at,
});

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


interface RoomRow {
  id: string;
  child_name: string;
  character_id: string;
  character_alias: string | null;
  character_gender: string | null;
  child_link_version: number;
  reading_level: string | null;
  trial_ends_at: string | null;
  pass_id: string | null;
  locale: string | null;
  family_hash: string | null;
  family_seed: string | null;
  family_name: string | null;
  expires_at: string;
  child_token_hash: string;
  parent_token_hash: string;
}
const ROOM_COLUMNS =
  'id, child_name, character_id, character_alias, character_gender, child_link_version, reading_level, trial_ends_at, pass_id, locale, family_hash, family_seed, family_name, expires_at, child_token_hash, parent_token_hash';
const toRoom = (d: RoomRow): RoomRecord => ({
  id: d.id,
  childName: d.child_name,
  characterId: d.character_id,
  characterAlias: d.character_alias,
  characterGender: d.character_gender,
  childLinkVersion: d.child_link_version ?? 0,
  readingLevel: d.reading_level ?? 'yes',
  trialEndsAt: d.trial_ends_at,
  passId: d.pass_id,
  locale: d.locale ?? 'es',
  familyHash: d.family_hash,
  familySeed: d.family_seed,
  familyName: d.family_name,
  expiresAt: d.expires_at,
  childTokenHash: d.child_token_hash,
  parentTokenHash: d.parent_token_hash,
});

export class SupabaseRoomStore implements RoomStore {
  async insertRoom(room: NewRoom): Promise<void> {
    const { error } = await getAdminClient().from('rooms').insert({
      child_token_hash: room.childTokenHash,
      parent_token_hash: room.parentTokenHash,
      child_name: room.childName,
      character_id: room.characterId,
      character_alias: room.characterAlias ?? null,
      character_gender: room.characterGender ?? null,
      creator_hash: room.creatorHash,
      expires_at: room.expiresAt,
      reading_level: room.readingLevel ?? 'yes',
      locale: room.locale ?? 'es',
      trial_ends_at: room.trialEndsAt ?? null,
      pass_id: room.passId ?? null,
      family_hash: room.familyHash ?? null,
      family_seed: room.familySeed ?? null,
      family_name: room.familyName ?? null,
    });
    if (isRateLimit(error)) throw new RoomError('RATE_LIMITED');
    if (error) throw new Error(`insertRoom: ${error.message}`);
  }

  async findRoomByTokenHash(hash: string): Promise<RoomRecord | null> {
    const { data, error } = await getAdminClient()
      .from('rooms')
      .select(ROOM_COLUMNS)
      .or(`child_token_hash.eq.${hash},parent_token_hash.eq.${hash}`)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle<RoomRow>();
    if (error || !data) return null;
    return toRoom(data);
  }

  async listRoomsByFamilyHash(hash: string): Promise<RoomRecord[]> {
    const { data, error } = await getAdminClient()
      .from('rooms')
      .select(ROOM_COLUMNS)
      .eq('family_hash', hash)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(50)
      .returns<RoomRow[]>();
    if (error) throw new Error(`listRoomsByFamilyHash: ${error.message}`);
    return (data ?? []).map(toRoom);
  }

  async updateFamilyName(hash: string, name: string | null): Promise<void> {
    const { error } = await getAdminClient().from('rooms').update({ family_name: name }).eq('family_hash', hash);
    if (error) throw new Error(`updateFamilyName: ${error.message}`);
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

  async updateChildLink(roomId: string, version: number, childTokenHash: string): Promise<boolean> {
    const { data, error } = await getAdminClient()
      .from('rooms')
      .update({ child_link_version: version, child_token_hash: childTokenHash })
      .eq('id', roomId)
      .select('id');
    if (error) throw new Error('No se pudo cambiar el enlace.');
    return (data?.length ?? 0) > 0;
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

  async updateRoom(roomId: string, patch: { childName?: string; characterId?: string; characterAlias?: string | null; characterGender?: string | null }): Promise<boolean> {
    const update: Record<string, string | null> = {};
    if (patch.childName !== undefined) update.child_name = patch.childName;
    if (patch.characterId !== undefined) update.character_id = patch.characterId;
    if (patch.characterAlias !== undefined) update.character_alias = patch.characterAlias;
    if (patch.characterGender !== undefined) update.character_gender = patch.characterGender;
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

  async countTrialRoomsByCreatorSince(creatorHash: string, sinceIso: string): Promise<number> {
    const { count, error } = await getAdminClient()
      .from('rooms')
      .select('id', { count: 'exact', head: true })
      .eq('creator_hash', creatorHash)
      .is('pass_id', null)
      .not('trial_ends_at', 'is', null)
      .gte('created_at', sinceIso);
    if (error) throw new Error(`countTrialRooms: ${error.message}`);
    return count ?? 0;
  }

  async insertPass(p: NewPass): Promise<PassRecord> {
    if (p.stripeSessionId) {
      const existing = await this.findPassByStripeSession(p.stripeSessionId);
      if (existing) return existing;
    }
    const { data, error } = await getAdminClient()
      .from('passes')
      .insert({
        token_hash: p.tokenHash,
        kind: p.kind,
        stripe_session_id: p.stripeSessionId ?? null,
        parent_pass_id: p.parentPassId ?? null,
        amount_cents: p.amountCents ?? null,
        expires_at: p.expiresAt,
      })
      .select(PASS_COLUMNS)
      .single<PassRow>();
    if (error || !data) {
      // Carrera entre el webhook y la página de éxito: el otro ya lo creó.
      if (p.stripeSessionId) {
        const again = await this.findPassByStripeSession(p.stripeSessionId);
        if (again) return again;
      }
      throw new Error(`insertPass: ${error?.message ?? 'sin datos'}`);
    }
    return toPass(data);
  }

  async findPassByTokenHash(hash: string): Promise<PassRecord | null> {
    const { data } = await getAdminClient().from('passes').select(PASS_COLUMNS).eq('token_hash', hash).maybeSingle<PassRow>();
    return data ? toPass(data) : null;
  }

  async findPassById(id: string): Promise<PassRecord | null> {
    const { data } = await getAdminClient().from('passes').select(PASS_COLUMNS).eq('id', id).maybeSingle<PassRow>();
    return data ? toPass(data) : null;
  }

  async findPassByStripeSession(sessionId: string): Promise<PassRecord | null> {
    const { data } = await getAdminClient().from('passes').select(PASS_COLUMNS).eq('stripe_session_id', sessionId).maybeSingle<PassRow>();
    return data ? toPass(data) : null;
  }

  async findGiftOf(passId: string): Promise<PassRecord | null> {
    const { data } = await getAdminClient().from('passes').select(PASS_COLUMNS).eq('parent_pass_id', passId).limit(1).maybeSingle<PassRow>();
    return data ? toPass(data) : null;
  }

  async countRoomsByPass(passId: string): Promise<number> {
    const { count, error } = await getAdminClient().from('rooms').select('id', { count: 'exact', head: true }).eq('pass_id', passId);
    if (error) throw new Error(`countRoomsByPass: ${error.message}`);
    return count ?? 0;
  }

  async attachPass(roomId: string, passId: string): Promise<boolean> {
    const { data, error } = await getAdminClient().from('rooms').update({ pass_id: passId }).eq('id', roomId).select('id');
    if (error) throw new Error(`attachPass: ${error.message}`);
    if ((data?.length ?? 0) === 0) return false;
    // El pase cuelga de la familia: lo reciben también las demás salas que aún no tengan uno.
    const { data: fam } = await getAdminClient().from('rooms').select('family_hash').eq('id', roomId).maybeSingle<{ family_hash: string | null }>();
    if (fam?.family_hash) {
      const { error: e2 } = await getAdminClient().from('rooms').update({ pass_id: passId }).eq('family_hash', fam.family_hash).is('pass_id', null);
      if (e2) throw new Error(`attachPass familia: ${e2.message}`);
    }
    return true;
  }

  async updateReadingLevel(roomId: string, level: string): Promise<boolean> {
    const { data, error } = await getAdminClient().from('rooms').update({ reading_level: level }).eq('id', roomId).select('id');
    if (error) throw new Error(`updateReadingLevel: ${error.message}`);
    return (data?.length ?? 0) > 0;
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
