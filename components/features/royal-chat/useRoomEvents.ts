'use client';

import { useEffect, useRef, useState } from 'react';
import { startPolling } from './mapping';

interface Options {
  /** Pide el estado completo (mensajes). Se llama al conectar, ante "refresh" y por sondeo de respaldo. */
  onRefresh: () => Promise<void>;
  /** El otro lado está escribiendo. */
  onTyping: () => void;
  /** Solo los padres: el niño entra/sale de la sala o abre el mensaje de entrada. */
  onPresence?: (p: { online: boolean; openedAt?: string }) => void;
}

const POLL_CONNECTED_MS = 60_000;
const POLL_FALLBACK_MS = 5_000;

/**
 * Tiempo real por SSE con sondeo de respaldo:
 *  - conectado: avisos instantáneos + sondeo lento (cubre entregas diferidas y reinicios)
 *  - sin conexión: sondeo cada 5 s hasta que EventSource reconecte solo.
 */
export function useRoomEvents(token: string, { onRefresh, onTyping, onPresence }: Options): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const refreshRef = useRef(onRefresh);
  const typingRef = useRef(onTyping);
  const presenceRef = useRef(onPresence);

  useEffect(() => {
    refreshRef.current = onRefresh;
    typingRef.current = onTyping;
    presenceRef.current = onPresence;
  });

  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const es = new EventSource(`/api/rooms/${token}/events`);
    es.addEventListener('ready', () => {
      setConnected(true);
      void refreshRef.current().catch(() => undefined);
    });
    es.addEventListener('refresh', () => void refreshRef.current().catch(() => undefined));
    es.addEventListener('typing', () => typingRef.current());
    es.addEventListener('presence', (e) => {
      try {
        presenceRef.current?.(JSON.parse((e as MessageEvent<string>).data) as { online: boolean; openedAt?: string });
      } catch {
        /* evento mal formado: se ignora */
      }
    });
    es.addEventListener('busy', () => {
      setConnected(false);
      es.close();
    });
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, [token]);

  useEffect(() => {
    const stop = startPolling(() => refreshRef.current(), connected ? POLL_CONNECTED_MS : POLL_FALLBACK_MS);
    return stop;
  }, [connected]);

  return { connected };
}
