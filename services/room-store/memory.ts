import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Bucket, MessageRecord, NewMessage, NewRoom, RoomRecord, RoomStore } from './types';

interface State {
  rooms: (RoomRecord & { expiresAt: string })[];
  messages: MessageRecord[];
  files: Map<string, { data: Buffer; contentType: string }>;
}

const g = globalThis as unknown as { __roomMemory?: State };
const state = (): State => (g.__roomMemory ??= { rooms: [], messages: [], files: new Map() });

/** Lee un archivo del almacén en memoria (lo sirve la ruta de desarrollo). */
export function readMemoryFile(bucket: string, path: string) {
  return state().files.get(`${bucket}/${path}`) ?? null;
}

/** Implementación en memoria: SOLO para desarrollo y pruebas automáticas. */
export class MemoryRoomStore implements RoomStore {
  async insertRoom(room: NewRoom): Promise<void> {
    state().rooms.push({
      id: randomUUID(),
      childName: room.childName,
      characterId: room.characterId,
      childTokenHash: room.childTokenHash,
      parentTokenHash: room.parentTokenHash,
      expiresAt: room.expiresAt,
    });
  }

  async findRoomByTokenHash(hash: string): Promise<RoomRecord | null> {
    const now = Date.now();
    const r = state().rooms.find((x) => (x.childTokenHash === hash || x.parentTokenHash === hash) && Date.parse(x.expiresAt) > now);
    return r ?? null;
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
      deliverAt: m.deliverAt ?? now,
      createdAt: now,
    };
    state().messages.push(rec);
    return rec;
  }

  async listMessages(roomId: string, opts: { deliveredOnly: boolean }): Promise<MessageRecord[]> {
    const now = Date.now();
    return state()
      .messages.filter((m) => m.roomId === roomId && (!opts.deliveredOnly || Date.parse(m.deliverAt) <= now))
      .sort((a, b) => Date.parse(a.deliverAt) - Date.parse(b.deliverAt))
      .slice(0, 200);
  }

  async countSystemMessagesSince(roomId: string, sinceIso: string): Promise<number> {
    const since = Date.parse(sinceIso);
    return state().messages.filter((m) => m.roomId === roomId && m.sender === 'system' && Date.parse(m.createdAt) >= since).length;
  }

  async uploadFile(bucket: Bucket, path: string, data: Buffer, contentType: string): Promise<void> {
    state().files.set(`${bucket}/${path}`, { data, contentType });
  }

  async signedUrls(bucket: Bucket, paths: string[]): Promise<Map<string, string>> {
    return new Map(paths.map((p) => [p, `/api/dev-media/${bucket}/${p}`]));
  }

  async deleteExpired(nowIso: string): Promise<{ rooms: number; files: number }> {
    const s = state();
    const now = Date.parse(nowIso);
    const expired = s.rooms.filter((r) => Date.parse(r.expiresAt) < now);
    let files = 0;
    for (const r of expired) {
      for (const key of [...s.files.keys()]) {
        if (key.includes(`/${r.id}/`)) {
          s.files.delete(key);
          files++;
        }
      }
      s.messages = s.messages.filter((m) => m.roomId !== r.id);
    }
    s.rooms = s.rooms.filter((r) => Date.parse(r.expiresAt) >= now);
    return { rooms: expired.length, files };
  }
}
