import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Bucket, MessageRecord, NewMessage, NewPass, NewRoom, PassRecord, RoomRecord, RoomStore } from './types';

type RoomRow = RoomRecord & { expiresAt: string; creatorHash: string; createdAt: number };
type PassRow = PassRecord & { tokenHash: string };

/** Con índices: las pruebas de carga miden la aplicación, no un barrido lineal del almacén. */
interface State {
  rooms: Map<string, RoomRow>; // id → sala
  byHash: Map<string, RoomRow>; // hash de token → sala
  messages: Map<string, MessageRecord[]>; // roomId → mensajes (orden de inserción)
  files: Map<string, { data: Buffer; contentType: string }>;
  passes: Map<string, PassRow>; // id → pase
}

const g = globalThis as unknown as { __roomMemory?: State };
const state = (): State => (g.__roomMemory ??= { rooms: new Map(), byHash: new Map(), messages: new Map(), files: new Map(), passes: new Map() });

/** Lee un archivo del almacén en memoria (lo sirve la ruta de desarrollo). */
export function readMemoryFile(bucket: string, path: string) {
  return state().files.get(`${bucket}/${path}`) ?? null;
}

/** Implementación en memoria: SOLO para desarrollo y pruebas automáticas. */
export class MemoryRoomStore implements RoomStore {
  async insertRoom(room: NewRoom): Promise<void> {
    const row: RoomRow = {
      id: randomUUID(),
      childName: room.childName,
      characterId: room.characterId,
      characterAlias: room.characterAlias ?? null,
      characterGender: room.characterGender ?? null,
      childLinkVersion: 0,
      readingLevel: room.readingLevel ?? 'yes',
      locale: room.locale ?? 'es',
      trialEndsAt: room.trialEndsAt ?? null,
      passId: room.passId ?? null,
      creatorHash: room.creatorHash,
      createdAt: Date.now(),
      childTokenHash: room.childTokenHash,
      parentTokenHash: room.parentTokenHash,
      expiresAt: room.expiresAt,
    };
    const st = state();
    st.rooms.set(row.id, row);
    st.byHash.set(row.childTokenHash, row);
    st.byHash.set(row.parentTokenHash, row);
  }

  async findRoomByTokenHash(hash: string): Promise<RoomRecord | null> {
    const r = state().byHash.get(hash);
    return r && Date.parse(r.expiresAt) > Date.now() ? r : null;
  }

  async insertMessage(m: NewMessage): Promise<MessageRecord> {
    const now = new Date().toISOString();
    const rec: MessageRecord = {
      id: randomUUID(),
      roomId: m.roomId,
      sender: m.sender,
      kind: m.kind,
      body: m.body ?? null,
      audioPath: m.audioPath ?? null,
      imagePath: m.imagePath ?? null,
      durationS: m.durationS ?? null,
      effect: m.effect ?? null,
      deliverAt: m.deliverAt ?? now,
      createdAt: now,
      editedAt: null,
    };
    const st = state();
    const list = st.messages.get(m.roomId) ?? [];
    list.push(rec);
    st.messages.set(m.roomId, list);
    return rec;
  }

  async listMessages(roomId: string, opts: { deliveredOnly: boolean }): Promise<MessageRecord[]> {
    const now = Date.now();
    return (state().messages.get(roomId) ?? [])
      .filter((m) => !opts.deliveredOnly || Date.parse(m.deliverAt) <= now)
      .sort((a, b) => Date.parse(a.deliverAt) - Date.parse(b.deliverAt))
      .slice(0, 200);
  }

  async getRoomVersion(roomId: string, opts: { deliveredOnly: boolean }): Promise<string> {
    const now = Date.now();
    const all = state().messages.get(roomId) ?? [];
    const delivered = all.filter((m) => Date.parse(m.deliverAt) <= now);
    const scope = opts.deliveredOnly ? delivered : all;
    const latest = [...scope].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
    const edited = all.reduce((max, m) => (m.editedAt && m.editedAt > max ? m.editedAt : max), '');
    return `${scope.length}.${delivered.length}.${latest?.id ?? '-'}.${edited || '-'}`;
  }

  async countSystemMessagesSince(roomId: string, sinceIso: string): Promise<number> {
    const since = Date.parse(sinceIso);
    return (state().messages.get(roomId) ?? []).filter((m) => m.sender === 'system' && Date.parse(m.createdAt) >= since).length;
  }

  async deleteMessage(roomId: string, messageId: string): Promise<MessageRecord | null> {
    const list = state().messages.get(roomId) ?? [];
    const i = list.findIndex((m) => m.id === messageId);
    if (i < 0) return null;
    const [row] = list.splice(i, 1);
    return row ?? null;
  }

  async removeFile(bucket: Bucket, path: string): Promise<void> {
    state().files.delete(`${bucket}/${path}`);
  }

  async countTrialRoomsByCreatorSince(creatorHash: string, sinceIso: string): Promise<number> {
    const since = Date.parse(sinceIso);
    let n = 0;
    for (const r of state().rooms.values()) if (r.creatorHash === creatorHash && !r.passId && r.trialEndsAt && r.createdAt >= since) n++;
    return n;
  }

  async insertPass(p: NewPass): Promise<PassRecord> {
    const st = state();
    if (p.stripeSessionId) {
      const existing = [...st.passes.values()].find((x) => x.stripeSessionId === p.stripeSessionId);
      if (existing) return existing;
    }
    const row: PassRow = {
      id: randomUUID(),
      tokenHash: p.tokenHash,
      kind: p.kind,
      stripeSessionId: p.stripeSessionId ?? null,
      parentPassId: p.parentPassId ?? null,
      roomsLimit: 10,
      expiresAt: p.expiresAt,
    };
    st.passes.set(row.id, row);
    return row;
  }

  async findPassByTokenHash(hash: string): Promise<PassRecord | null> {
    return [...state().passes.values()].find((x) => x.tokenHash === hash) ?? null;
  }

  async findPassByStripeSession(sessionId: string): Promise<PassRecord | null> {
    return [...state().passes.values()].find((x) => x.stripeSessionId === sessionId) ?? null;
  }

  async findGiftOf(passId: string): Promise<PassRecord | null> {
    return [...state().passes.values()].find((x) => x.parentPassId === passId) ?? null;
  }

  async countRoomsByPass(passId: string): Promise<number> {
    let n = 0;
    for (const r of state().rooms.values()) if (r.passId === passId) n++;
    return n;
  }

  async attachPass(roomId: string, passId: string): Promise<boolean> {
    const row = state().rooms.get(roomId);
    if (!row) return false;
    row.passId = passId;
    return true;
  }

  async updateReadingLevel(roomId: string, level: string): Promise<boolean> {
    const row = state().rooms.get(roomId);
    if (!row) return false;
    row.readingLevel = level;
    return true;
  }

  async updateChildLink(roomId: string, version: number, childTokenHash: string): Promise<boolean> {
    const st = state();
    const row = st.rooms.get(roomId);
    if (!row) return false;
    st.byHash.delete(row.childTokenHash);
    row.childTokenHash = childTokenHash;
    row.childLinkVersion = version;
    st.byHash.set(childTokenHash, row);
    return true;
  }

  async getMessage(roomId: string, messageId: string): Promise<MessageRecord | null> {
    return (state().messages.get(roomId) ?? []).find((m) => m.id === messageId) ?? null;
  }

  async updateMessageBody(roomId: string, messageId: string, body: string | null, nowIso: string): Promise<MessageRecord | null> {
    const rec = (state().messages.get(roomId) ?? []).find((m) => m.id === messageId && m.sender === 'king' && (m.kind === 'text' || m.kind === 'photo'));
    if (!rec) return null;
    rec.body = body;
    rec.editedAt = nowIso;
    return rec;
  }

  async updateRoom(roomId: string, patch: { childName?: string; characterId?: string; characterAlias?: string | null; characterGender?: string | null }): Promise<boolean> {
    const row = state().rooms.get(roomId);
    if (!row) return false;
    if (patch.childName !== undefined) row.childName = patch.childName;
    if (patch.characterId !== undefined) row.characterId = patch.characterId;
    if (patch.characterAlias !== undefined) row.characterAlias = patch.characterAlias;
    if (patch.characterGender !== undefined) row.characterGender = patch.characterGender;
    return true;
  }

  async listFilePaths(roomId: string): Promise<{ bucket: Bucket; path: string }[]> {
    const out: { bucket: Bucket; path: string }[] = [];
    for (const m of state().messages.get(roomId) ?? []) {
      if (m.audioPath) out.push({ bucket: 'voices', path: m.audioPath });
      if (m.imagePath) out.push({ bucket: 'media', path: m.imagePath });
    }
    return out;
  }

  async deleteRoom(roomId: string): Promise<void> {
    const st = state();
    const row = st.rooms.get(roomId);
    if (row) {
      st.byHash.delete(row.childTokenHash);
      st.byHash.delete(row.parentTokenHash);
    }
    st.rooms.delete(roomId);
    st.messages.delete(roomId);
  }

  async deletePendingMessage(roomId: string, messageId: string, nowIso: string): Promise<boolean> {
    const list = state().messages.get(roomId) ?? [];
    const now = Date.parse(nowIso);
    const i = list.findIndex((m) => m.id === messageId && m.sender === 'king' && Date.parse(m.deliverAt) > now);
    if (i < 0) return false;
    list.splice(i, 1);
    return true;
  }

  async countVoiceRepliesSince(roomId: string, sinceIso: string): Promise<number> {
    const since = Date.parse(sinceIso);
    return (state().messages.get(roomId) ?? []).filter((m) => m.sender === 'king' && m.kind === 'voice' && Date.parse(m.createdAt) >= since).length;
  }

  async sumVoiceCharsSince(sinceIso: string): Promise<number> {
    const since = Date.parse(sinceIso);
    let n = 0;
    for (const list of state().messages.values()) for (const m of list) if (m.sender === 'king' && m.kind === 'voice' && Date.parse(m.createdAt) >= since) n += m.body?.length ?? 0;
    return n;
  }

  async uploadFile(bucket: Bucket, path: string, data: Buffer, contentType: string): Promise<void> {
    state().files.set(`${bucket}/${path}`, { data, contentType });
  }

  async signedUrls(bucket: Bucket, paths: string[]): Promise<Map<string, string>> {
    return new Map(paths.map((p) => [p, `/api/dev-media/${bucket}/${p}`]));
  }

  async deleteExpired(nowIso: string): Promise<{ rooms: number; files: number }> {
    const st = state();
    const now = Date.parse(nowIso);
    let rooms = 0;
    let files = 0;
    for (const r of [...st.rooms.values()]) {
      if (Date.parse(r.expiresAt) >= now) continue;
      for (const key of [...st.files.keys()]) {
        if (key.includes(`/${r.id}/`)) {
          st.files.delete(key);
          files++;
        }
      }
      st.messages.delete(r.id);
      st.byHash.delete(r.childTokenHash);
      st.byHash.delete(r.parentTokenHash);
      st.rooms.delete(r.id);
      rooms++;
    }
    return { rooms, files };
  }
}
