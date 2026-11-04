/**
 * Vibración segura: Chrome la bloquea (y avisa en consola) si el usuario aún no ha
 * interactuado con la página. Solo vibramos si ya hubo una interacción.
 */
export function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  if (ua && !ua.hasBeenActive) return;
  navigator.vibrate(pattern);
}
