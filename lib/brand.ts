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
        tagline: 'El elfo Chispa está de camino',
        title: 'Un elfo travieso va a colarse en tu casa',
        subtitle: 'Llega el 1 de diciembre desde el Polo Norte. Cada noche, una trastada; cada mañana, un mensaje suyo al móvil de casa.',
        countdown: days <= 1 ? '¡Llega mañana!' : `Llega el 1 de diciembre · faltan ${days} días`,
        defaultCharacter: 'duende_chispa',
      };
    }
    case 'elf':
      return {
        phase,
        tagline: 'El elfo Chispa ya está aquí',
        title: '¡El elfo travieso ya está en casa!',
        subtitle: 'Cada noche hace una trastada y cada mañana escribe un mensaje al móvil de casa. ¿Dónde se habrá escondido hoy?',
        countdown: null,
        defaultCharacter: 'duende_chispa',
      };
    case 'noel':
      return {
        phase,
        tagline: 'Línea directa con el Polo Norte',
        title: 'Que antes de abrir los regalos, hable con Papá Noel',
        subtitle: 'Papá Noel tiene una línea mágica para escribirse con los peques. Sus mensajes llegan en directo al móvil de casa.',
        countdown: null,
        defaultCharacter: 'papa_noel',
      };
    case 'reyes':
      return {
        phase,
        tagline: 'Línea directa con Oriente',
        title: 'Que los Reyes Magos le contesten en directo',
        subtitle: 'Melchor, Gaspar y Baltasar leen cada mensaje desde Oriente y contestan en directo al móvil de casa.',
        countdown: null,
        defaultCharacter: 'melchor',
      };
    default:
      return {
        phase,
        tagline: 'El Ratoncito Pérez escribe desde su castillo',
        title: 'Que el Ratoncito Pérez le escriba cuando se le caiga un diente',
        subtitle: 'Cuando se cae un diente, el Ratoncito Pérez escribe desde su castillo, en directo, al móvil de casa.',
        countdown: null,
        defaultCharacter: 'raton_perez',
      };
  }
}

/** Eslogan corto según la fecha (para otros usos). */
export const seasonTagline = (now: Date = new Date()): string => heroFor(now).tagline;
