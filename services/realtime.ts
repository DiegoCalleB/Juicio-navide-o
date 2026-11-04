import 'server-only';

/**
 * Bus de eventos en memoria por sala (alimenta el canal SSE).
 * Cubre una instancia del servidor. Con varias réplicas, sustituir por
 * Supabase Realtime Broadcast o Redis manteniendo esta misma interfaz;
 * mientras tanto el cliente refresca por sondeo de respaldo.
 */
export type Audience = 'child' | 'parent';

export type RoomEvent =
  | { type: 'refresh' }
  | { type: 'typing'; from: Audience }
  /** El niño entra o sale de la sala (solo se avisa a los padres). `openedAt` = cuándo abrió el mensaje de entrada. */
  | { type: 'presence'; online: boolean; openedAt?: string };

type Listener = (event: RoomEvent) => void;

interface Subscriber {
  audience: Audience;
  listener: Listener;
}

const g = globalThis as unknown as { __roomBus?: Map<string, Set<Subscriber>> };
const bus = () => (g.__roomBus ??= new Map());

/** Cuándo abrió el niño el mensaje de entrada (en memoria; se pierde al reiniciar). */
const gOpened = globalThis as unknown as { __roomOpened?: Map<string, string> };
const opened = () => (gOpened.__roomOpened ??= new Map());

export const MAX_SUBSCRIBERS_PER_ROOM = 8;

export function subscribe(roomId: string, audience: Audience, listener: Listener): (() => void) | null {
  const room = bus();
  const set = room.get(roomId) ?? new Set<Subscriber>();
  if (set.size >= MAX_SUBSCRIBERS_PER_ROOM) return null;
  const sub: Subscriber = { audience, listener };
  const wasOnline = audience === 'child' && childOnline(roomId);
  set.add(sub);
  room.set(roomId, set);
  if (audience === 'child' && !wasOnline) publish(roomId, presenceEvent(roomId, true), 'parent');
  return () => {
    set.delete(sub);
    if (set.size === 0) room.delete(roomId);
    if (audience === 'child' && !childOnline(roomId)) publish(roomId, presenceEvent(roomId, false), 'parent');
  };
}

export function childOnline(roomId: string): boolean {
  for (const sub of bus().get(roomId) ?? []) if (sub.audience === 'child') return true;
  return false;
}

export function presenceEvent(roomId: string, online = childOnline(roomId)): RoomEvent {
  const openedAt = opened().get(roomId);
  return { type: 'presence', online, ...(openedAt ? { openedAt } : {}) };
}

/** El niño ha abierto el mensaje de entrada: se avisa a los padres. */
export function markOpened(roomId: string): void {
  const at = new Date().toISOString();
  if (opened().size > 5000) opened().clear();
  opened().set(roomId, at);
  publish(roomId, presenceEvent(roomId, true), 'parent');
}

/** `to` limita el destinatario; sin él, llega a todos los conectados de la sala. */
export function publish(roomId: string, event: RoomEvent, to?: Audience): void {
  for (const sub of bus().get(roomId) ?? []) {
    if (to && sub.audience !== to) continue;
    try {
      sub.listener(event);
    } catch {
      /* un oyente roto no debe afectar al resto */
    }
  }
}

/** Avisa a ambos lados de que hay cambios; admite entrega diferida. */
export function publishRefresh(roomId: string, deliverAt?: string): void {
  publish(roomId, { type: 'refresh' });
  const delay = deliverAt ? Date.parse(deliverAt) - Date.now() : 0;
  if (delay > 500 && delay < 2 * 60 * 60_000) {
    const t = setTimeout(() => publish(roomId, { type: 'refresh' }), delay + 200);
    t.unref?.();
  }
}
