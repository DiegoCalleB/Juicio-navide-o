import type { RoomMessageDTO } from '@/lib/royal';
import type { ChatMessage } from './types';

export function seedFrom(id: string): number {
  let h = 7;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 2147483647;
  return h || 1;
}

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

export function toChatMessage(m: RoomMessageDTO): ChatMessage | null {
  const base = { id: m.id, from: m.from, time: fmtTime(m.at) };
  if (m.kind === 'voice') {
    return { ...base, kind: 'voice', duration: m.duration ?? 5, seed: seedFrom(m.id), src: m.audioUrl };
  }
  return m.text ? { ...base, kind: 'text', text: m.text } : null;
}

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

/** Polling que se pausa con la pestaña oculta y reanuda al volver. */
export function startPolling(fn: () => Promise<void>, everyMs: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  const loop = async () => {
    if (stopped) return;
    if (document.visibilityState === 'visible') await fn().catch(() => undefined);
    timer = setTimeout(loop, everyMs);
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') void fn().catch(() => undefined);
  };
  document.addEventListener('visibilitychange', onVisible);
  void loop();
  return () => {
    stopped = true;
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
