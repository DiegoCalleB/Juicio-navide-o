import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Bucket, MessageRecord, NewMessage, NewRoom, RoomRecord, RoomStore } from './types';

type RoomRow = RoomRecord & { expiresAt: string };

/** Con índices: las pruebas de carga miden la aplicación, no un barrido lineal del almacén. */
interface State {
  rooms: Map<string, RoomRow>; // id → sala
  byHash: Map<string, RoomRow>; // hash de token → sala
  messages: Map<string, MessageRecord[]>; // roomId → mensajes (orden de inserción)
  files: Map<string, { data: Buffer; contentType: string }>;
}

const g = globalThis as unknown as { __roomMemory?: State };
const state = (): State => (g.__roomMemory ??= { rooms: new Map(), byHash: new Map(), messages: new Map(), files: new Map() });

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
    return `${scope.length}.${delivered.length}.${latest?.id ?? '-'}`;
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
