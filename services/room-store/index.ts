import 'server-only';
import { MemoryRoomStore } from './memory';
import { SupabaseRoomStore } from './supabase';
import type { RoomStore } from './types';

export type { Bucket, MessageRecord, RoomRecord, RoomStore } from './types';

let store: RoomStore | undefined;

/** Producción: Supabase. `ROOMS_STORE=memory` solo se admite fuera de producción. */
export function getRoomStore(): RoomStore {
  if (store) return store;
  if (process.env.ROOMS_STORE === 'memory') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ROOMS_STORE=memory no está permitido en producción.');
    }
    store = new MemoryRoomStore();
  } else {
    store = new SupabaseRoomStore();
  }
  return store;
}

export const isMemoryStore = () => process.env.ROOMS_STORE === 'memory' && process.env.NODE_ENV !== 'production';
