/**
 * Los peques de la casa, guardados en ESTE móvil (solo navegador) para elegirlos en un desplegable.
 * Sobrevive a quitar una sala de la lista o a que una sala caduque. Solo nombre de pila y si ya lee.
 */
export interface Kid {
  name: string;
  reading: 'yes' | 'learning' | 'no';
}

const KEY = 'magic-kids';
const MAX = 8;

const isReading = (v: unknown): v is Kid['reading'] => v === 'yes' || v === 'learning' || v === 'no';

export function loadKids(): Kid[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as Kid[];
    return Array.isArray(raw)
      ? raw.filter((k) => typeof k?.name === 'string' && k.name.trim() !== '' && k.name.length <= 30).map((k) => ({ name: k.name.trim(), reading: isReading(k.reading) ? k.reading : 'yes' }))
      : [];
  } catch {
    return [];
  }
}

/** Mezcla listas por nombre (sin distinguir mayúsculas); la primera lista gana en caso de duplicado. */
export function mergeKids(...lists: Kid[][]): Kid[] {
  const seen = new Set<string>();
  const out: Kid[] = [];
  for (const k of lists.flat()) {
    const key = k.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ name: k.name.trim(), reading: k.reading });
  }
  return out.slice(0, MAX);
}

export function saveKids(kids: Kid[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(mergeKids(kids, loadKids())));
  } catch {
    /* sin almacenamiento */
  }
}
