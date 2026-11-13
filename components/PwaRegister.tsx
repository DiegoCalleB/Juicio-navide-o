'use client';

import { useEffect } from 'react';

/** Registra el service worker (solo en producción): página sin conexión e instalación como app. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* sin service worker la web funciona igual */
    });
  }, []);
  return null;
}
