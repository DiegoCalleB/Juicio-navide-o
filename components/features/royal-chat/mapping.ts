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
  if (m.kind === 'photo') {
    return m.imageUrl ? { ...base, kind: 'photo', caption: m.text ?? '', src: m.imageUrl } : null;
  }
  return m.text ? { ...base, kind: 'text', text: m.text, ...(m.effect ? { effect: m.effect } : {}) } : null;
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

/** Notas de voz seguidas del mismo remitente que van después de la posición `index` (para reproducirlas en cadena). */
export function voiceFollowUps<T>(list: T[], index: number, pick: (m: T) => { id: string; from: string; voiceSrc?: string } | null): { id: string; src: string }[] {
  const first = list[index] ? pick(list[index]) : null;
  if (!first) return [];
  const out: { id: string; src: string }[] = [];
  for (let j = index + 1; j < list.length; j++) {
    const m = list[j] ? pick(list[j] as T) : null;
    if (!m || m.from !== first.from || !m.voiceSrc) break;
    out.push({ id: m.id, src: m.voiceSrc });
  }
  return out;
}
