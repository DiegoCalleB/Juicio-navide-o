import 'server-only';
import { MemoryRoomStore } from './memory';
import { SupabaseRoomStore } from './supabase';
import type { RoomStore } from './types';

export type { Bucket, MessageRecord, RoomRecord, RoomStore } from './types';

let store: RoomStore | undefined;

/**
 * El almacén en memoria es solo para desarrollo y pruebas. En producción se rechaza,
 * salvo la excepción explícita y ruidosa de las pruebas de carga.
 */
function memoryAllowed(): boolean {
  if (process.env.ROOMS_STORE !== 'memory') return false;
  if (process.env.NODE_ENV !== 'production') return true;
  return process.env.ALLOW_MEMORY_STORE_FOR_LOAD_TEST === '1';
}

/** Producción: Supabase. `ROOMS_STORE=memory` solo se admite fuera de producción (o en pruebas de carga). */
export function getRoomStore(): RoomStore {
  if (store) return store;
  if (process.env.ROOMS_STORE === 'memory') {
    if (!memoryAllowed()) {
      throw new Error('ROOMS_STORE=memory no está permitido en producción.');
    }
    if (process.env.NODE_ENV === 'production') console.warn('⚠️  Almacén EN MEMORIA activo en producción: SOLO para pruebas de carga.');
    store = new MemoryRoomStore();
  } else {
    store = new SupabaseRoomStore();
  }
  return store;
}

export const isMemoryStore = () => memoryAllowed();
