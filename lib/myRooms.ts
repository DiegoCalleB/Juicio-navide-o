/**
 * "Mis salas": lista de salas creadas en ESTE dispositivo (solo navegador).
 * Guarda los enlaces para que los padres puedan volver al panel sin buscar el mensaje donde lo copiaron.
 * Vive en localStorage: no sale del móvil y se borra si limpian los datos del navegador.
 */
import type { CharacterId } from '@/lib/characters';

export interface SavedRoom {
  childName: string;
  characterId: CharacterId;
  /** Rutas relativas (/paje/…, /r/…): funcionan con cualquier dominio. */
  parentPath: string;
  childPath: string;
  createdAt: string;
}

const KEY = 'magic-rooms';
const MAX = 12;

export function loadRooms(): SavedRoom[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as SavedRoom[];
    return Array.isArray(raw) ? raw.filter((r) => typeof r?.parentPath === 'string' && r.parentPath.startsWith('/paje/')) : [];
  } catch {
    return [];
  }
}

function write(rooms: SavedRoom[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rooms.slice(0, MAX)));
  } catch {
    /* sin almacenamiento: no pasa nada, los enlaces siguen en pantalla */
  }
}

export function saveRoom(room: SavedRoom): void {
  write([room, ...loadRooms().filter((r) => r.parentPath !== room.parentPath)]);
}

export function removeRoom(parentPath: string): void {
  write(loadRooms().filter((r) => r.parentPath !== parentPath));
}
