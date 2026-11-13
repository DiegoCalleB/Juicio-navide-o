/** Marca de la app y portada de temporada (la marca no cambia; el gancho sí, según el calendario). */
export const BRAND = 'Línea Mágica';

export type SeasonPhase = 'elf-pre' | 'elf' | 'noel' | 'reyes' | 'raton';

export interface Hero {
  phase: SeasonPhase;
  tagline: string;
  title: string;
  subtitle: string;
  /** Solo antes de la llegada del elfo: "Faltan 17 días" / "¡Llega mañana!". */
  countdown: string | null;
  /** Personaje que sale preseleccionado en el formulario. */
  defaultCharacter: 'duende_chispa' | 'papa_noel' | 'melchor' | 'raton_perez';
}

/** Fecha y hora en España (año, mes 1-12, día). */
function madrid(now: Date): { y: number; m: number; d: number } {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).split('-').map(Number);
  return { y: p[0] ?? now.getUTCFullYear(), m: p[1] ?? 1, d: p[2] ?? 1 };
}

/** Los elfos llegan el 1 de diciembre (cambiable con ELF_ARRIVAL_DATE=AAAA-MM-DD). */
function elfArrival(y: number): { y: number; m: number; d: number } {
  const env = process.env.ELF_ARRIVAL_DATE;
  const m = env && /^\d{4}-\d{2}-\d{2}$/.test(env) ? env.split('-').map(Number) : null;
  return m ? { y: m[0]!, m: m[1]!, d: m[2]! } : { y, m: 12, d: 1 };
}

const dayNumber = (x: { y: number; m: number; d: number }) => Math.floor(Date.UTC(x.y, x.m - 1, x.d) / 86_400_000);

export function seasonPhase(now: Date = new Date()): SeasonPhase {
  const t = madrid(now);
  const arrival = elfArrival(t.y);
  const today = dayNumber(t);
  const arrive = dayNumber(arrival);
  const nov1 = dayNumber({ y: arrival.y, m: 11, d: 1 });
  const dec15 = dayNumber({ y: arrival.y, m: 12, d: 15 });
  const dec26 = dayNumber({ y: arrival.y, m: 12, d: 26 });
  if (today >= nov1 && today < arrive) return 'elf-pre';
  if (today >= arrive && today < dec15) return 'elf';
  if (today >= dec15 && today < dec26) return 'noel';
  if (today >= dec26 || (t.m === 1 && t.d <= 6)) return 'reyes';
  if (t.m === 10 && t.d >= 15) return 'noel';
  return 'raton';
}

export function heroFor(now: Date = new Date()): Hero {
  const phase = seasonPhase(now);
  const t = madrid(now);
  switch (phase) {
    case 'elf-pre': {
      const days = dayNumber(elfArrival(t.y)) - dayNumber(t);
      return {
        phase,
        tagline: 'Prepara la llegada del elfo travieso',
        title: 'Un elfo travieso va a colarse en tu casa',
        subtitle: 'Cada noche una trastada y, cada mañana, un mensaje suyo para tu peque. Prepáralo antes de que llegue.',
        countdown: days <= 1 ? '¡Llega mañana!' : `Llega el 1 de diciembre · faltan ${days} días`,
        defaultCharacter: 'duende_chispa',
      };
    }
    case 'elf':
      return {
        phase,
        tagline: 'El elfo travieso ya está en casa',
        title: '¡El elfo travieso ya está en casa!',
        subtitle: 'Cada noche una trastada. Cada mañana, un mensaje suyo para tu peque, escrito por ti en secreto.',
        countdown: null,
        defaultCharacter: 'duende_chispa',
      };
    case 'noel':
      return {
        phase,
        tagline: 'Papá Noel te contesta en directo',
        title: 'Que antes de abrir los regalos, hable con Papá Noel',
        subtitle: 'Tu peque le escribe y tú contestas en secreto desde tu móvil. A él le llega como si fuera el personaje.',
        countdown: null,
        defaultCharacter: 'papa_noel',
      };
    case 'reyes':
      return {
        phase,
        tagline: 'Los Reyes Magos te contestan en directo',
        title: 'Que los Reyes Magos le contesten en directo',
        subtitle: 'Tu peque les escribe y tú contestas en secreto desde tu móvil. A él le llega como si fueran los Reyes.',
        countdown: null,
        defaultCharacter: 'melchor',
      };
    default:
      return {
        phase,
        tagline: 'El Ratoncito Pérez te escribe en directo',
        title: 'Que el Ratoncito Pérez le escriba cuando se le caiga un diente',
        subtitle: 'Tu peque le escribe y tú contestas en secreto desde tu móvil. A él le llega como si fuera el Ratoncito.',
        countdown: null,
        defaultCharacter: 'raton_perez',
      };
  }
}

/** Eslogan corto según la fecha (para otros usos). */
export const seasonTagline = (now: Date = new Date()): string => heroFor(now).tagline;
