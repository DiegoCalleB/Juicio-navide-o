'use client';

import { useEffect } from 'react';

const HIDDEN_LIMIT_MS = 60_000;

/**
 * Bloqueo automático: si la app pasa a segundo plano más de un minuto (el momento en que le das el móvil al peque),
 * bloquea el panel y recarga: al volver, pide el PIN. Solo actúa si hay PIN.
 */
export function useAutoLock(enabled: boolean, token: string) {
  useEffect(() => {
    if (!enabled) return;
    let hiddenAt = 0;
    const onChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      const away = hiddenAt > 0 ? Date.now() - hiddenAt : 0;
      hiddenAt = 0;
      if (away > HIDDEN_LIMIT_MS) {
        void fetch(`/api/rooms/${token}/pin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'lock' }) }).finally(() => window.location.reload());
      }
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, [enabled, token]);
}
