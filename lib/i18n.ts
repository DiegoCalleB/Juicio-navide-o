/**
 * Idiomas y variantes. Hoy: español de España ('es') y español de Latinoamérica ('es-419').
 * El texto fuente está escrito en español de España; la variante latinoamericana se obtiene
 * con un diccionario de palabras (regionalize). Añadir otro idioma (p. ej. inglés) significará
 * añadir un catálogo de textos aparte: esta es la puerta de entrada (detección, cookie, sala).
 */
export type Locale = 'es' | 'es-419';

export const LOCALES: { id: Locale; label: string; flag: string }[] = [
  { id: 'es', label: 'España', flag: '🇪🇸' },
  { id: 'es-419', label: 'Latinoamérica', flag: '🌎' },
];

export const DEFAULT_LOCALE: Locale = 'es';
/** Preferencia de idioma elegida por la persona (cookie funcional, 1 año). */
export const LOCALE_COOKIE = 'lm-locale';

export function parseLocale(v: unknown): Locale | null {
  return v === 'es' || v === 'es-419' ? v : null;
}

/**
 * Elige la variante según la cabecera Accept-Language del navegador (no la IP: falla con viajeros y VPN).
 * Toma la primera lengua española de la lista: `es-ES` o `es` → España; cualquier otro `es-XX` → Latinoamérica.
 * Si no hay ninguna lengua española, usa el valor por defecto.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const tags = header
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.slice(2)) : 1 };
    })
    .filter((t) => t.tag && Number.isFinite(t.q) && t.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    if (tag === 'es' || tag === 'es-es') return 'es';
    if (tag.startsWith('es-')) return 'es-419';
  }
  return DEFAULT_LOCALE;
}

// ── Variante latinoamericana ──────────────────────────────────────────────

/** Palabras sueltas (sin distinguir mayúsculas; se conserva la forma: "Móvil" → "Celular"). */
const WORDS: Record<string, string> = {
  móvil: 'celular',
  móviles: 'celulares',
  ordenador: 'computadora',
  gafas: 'lentes',
  zapatillas: 'zapatos',
  coche: 'auto',
  coches: 'autos',
  cogido: 'agarrado',
  // "vosotros" → "ustedes"
  queráis: 'quieran',
  habéis: 'han',
  compráis: 'compran',
  tenéis: 'tienen',
  podéis: 'pueden',
  sois: 'son',
  seguís: 'siguen',
  vuestro: 'su',
  vuestra: 'su',
  vuestros: 'sus',
  vuestras: 'sus',
};

/** Expresiones de varias palabras (se aplican antes que las sueltas). */
const PHRASES: [string, string][] = [
  ['pasta de dientes', 'pasta dental'],
  ['os dormíais', 'dormían'],
];

const WORD_RE = new RegExp(`(?<![\\p{L}\\p{N}_])(${Object.keys(WORDS).join('|')})(?![\\p{L}\\p{N}_])`, 'giu');

function matchCase(from: string, to: string): string {
  if (from === from.toUpperCase() && from.length > 1) return to.toUpperCase();
  if (from[0] === from[0]?.toUpperCase()) return to.charAt(0).toUpperCase() + to.slice(1);
  return to;
}

/** Adapta un texto escrito en español de España al español de Latinoamérica. Para 'es' no cambia nada. */
export function regionalize(text: string, locale: Locale): string {
  if (locale === 'es' || !text) return text;
  let out = text;
  for (const [from, to] of PHRASES) {
    out = out.replace(new RegExp(from, 'gi'), (m) => matchCase(m, to));
  }
  return out.replace(WORD_RE, (m) => matchCase(m, WORDS[m.toLowerCase()] ?? m));
}

/** Aplica regionalize a todas las cadenas de un objeto (personajes, listas de frases…). */
export function regionalizeDeep<T>(value: T, locale: Locale): T {
  if (locale === 'es') return value;
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return regionalize(v, locale);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(value) as T;
}
