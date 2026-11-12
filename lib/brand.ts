/** Marca de la app y gancho de temporada (la marca no cambia; el eslogan sí, según la época). */
export const BRAND = 'Línea Mágica';

/** Eslogan según la fecha (hora de España): Papá Noel → Reyes → Ratoncito Pérez el resto del año. */
export function seasonTagline(now: Date = new Date()): string {
  const madrid = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const m = madrid.getMonth() + 1;
  const d = madrid.getDate();
  if ((m === 12 && d >= 26) || (m === 1 && d <= 6)) return 'Los Reyes Magos te contestan en directo';
  if (m === 11 || m === 12 || (m === 10 && d >= 15)) return 'Papá Noel te contesta en directo';
  return 'El Ratoncito Pérez te escribe en directo';
}
