/**
 * Reproductor único de notas de voz (solo navegador).
 * - Un solo elemento <audio> compartido: suena una nota a la vez y, al terminar, arrancan solas
 *   las siguientes seguidas del mismo remitente (como en WhatsApp). Reutilizar el mismo elemento
 *   permite que iOS siga reproduciendo sin un nuevo toque.
 */
export interface Track {
  id: string;
  src: string;
}

interface State {
  id: string | null;
  playing: boolean;
  /** Última nota que no pudo reproducirse. */
  failedId: string | null;
}

let audio: HTMLAudioElement | null = null;
let queue: Track[] = [];
let loadedSrc = '';
const state: State = { id: null, playing: false, failedId: null };
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getState = (): Readonly<State> => state;

/** Progreso 0–1 de la nota indicada (0 si no es la actual). */
export function getProgress(id: string, fallbackDuration: number): number {
  if (!audio || state.id !== id) return 0;
  const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : fallbackDuration;
  return Math.min(1, audio.currentTime / Math.max(0.1, total));
}

function el(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.preload = 'auto';
    audio.addEventListener('ended', () => {
      const next = queue.shift();
      if (next) void start(next, queue);
      else {
        state.playing = false;
        state.id = null;
        emit();
      }
    });
  }
  return audio;
}

async function start(track: Track, followUps: Track[]): Promise<void> {
  const a = el();
  queue = followUps;
  if (state.id !== track.id || loadedSrc !== track.src) {
    a.src = track.src;
    loadedSrc = track.src;
    a.currentTime = 0;
  } else if (a.ended) {
    a.currentTime = 0;
  }
  state.id = track.id;
  state.failedId = null;
  try {
    await a.play();
    state.playing = true;
  } catch {
    state.playing = false;
    state.failedId = track.id;
    queue = [];
  }
  emit();
}

/** Reproduce `track`; al acabar seguirán `followUps` en orden. */
export function play(track: Track, followUps: Track[] = []): Promise<void> {
  return start(track, followUps);
}

export function pause(): void {
  audio?.pause();
  state.playing = false;
  emit();
}
