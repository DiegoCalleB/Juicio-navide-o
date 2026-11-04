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
  | { type: 'typing'; from: Audience };

type Listener = (event: RoomEvent) => void;

interface Subscriber {
  audience: Audience;
  listener: Listener;
}

const g = globalThis as unknown as { __roomBus?: Map<string, Set<Subscriber>> };
const bus = () => (g.__roomBus ??= new Map());

export const MAX_SUBSCRIBERS_PER_ROOM = 8;

export function subscribe(roomId: string, audience: Audience, listener: Listener): (() => void) | null {
  const room = bus();
  const set = room.get(roomId) ?? new Set<Subscriber>();
  if (set.size >= MAX_SUBSCRIBERS_PER_ROOM) return null;
  const sub: Subscriber = { audience, listener };
  set.add(sub);
  room.set(roomId, set);
  return () => {
    set.delete(sub);
    if (set.size === 0) room.delete(roomId);
  };
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
