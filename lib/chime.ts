/**
 * Campanillas de trineo sintetizadas con Web Audio (sin archivos de audio).
 * Los navegadores solo dejan sonar tras un gesto del usuario: la pantalla de
 * entrada del niño llama a `unlockAudio()` al tocar el botón.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** Llamar dentro de un gesto del usuario (toque). */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume().catch(() => undefined);
}

/** Un tintineo corto y suave: 3 notas agudas con decaimiento rápido. */
export function playChime(): void {
  const c = getCtx();
  if (!c || c.state !== 'running') return;
  const now = c.currentTime;
  const master = c.createGain();
  master.gain.value = 0.16;
  master.connect(c.destination);
  [1567.98, 2093, 2637.02].forEach((freq, i) => {
    const t = now + i * 0.11;
    for (const [mult, vol] of [[1, 1], [2.76, 0.35]] as const) {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * mult;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 0.95);
    }
  });
}
