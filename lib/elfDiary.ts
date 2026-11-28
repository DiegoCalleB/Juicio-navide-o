import 'server-only';
import { elfNights } from '@/lib/elfIdeas';

/**
 * Diario de travesuras de Chispa (público, REGLA DE ORO): solo lo que Chispa cuenta que hizo, en primera
 * persona. Nunca cómo se prepara ni quién lo hace. Las noches se abren día a día en diciembre para no
 * adelantar a ningún peque la trastada de mañana; antes, se enseñan tres páginas «del año pasado».
 */
export interface DiaryEntry {
  day: number;
  title: string;
  text: string;
}

const SAMPLE_DAYS = [2, 10, 4];

function madridDate(now: Date): { m: number; d: number } {
  const p = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', month: 'numeric', day: 'numeric' }).formatToParts(now);
  return { m: Number(p.find((x) => x.type === 'month')?.value), d: Number(p.find((x) => x.type === 'day')?.value) };
}

export function diaryFor(now: Date): { mode: 'sample' | 'live' | 'all'; entries: DiaryEntry[] } {
  const all = elfNights().map((n) => ({ day: n.day, title: n.title, text: n.message.replaceAll('[nombre]', 'peque') }));
  const { m, d } = madridDate(now);
  if (m === 12 && d <= 24) return { mode: 'live', entries: all.filter((e) => e.day <= d).reverse() };
  if (m === 12 || m === 1) return { mode: 'all', entries: all.slice().reverse() };
  return { mode: 'sample', entries: SAMPLE_DAYS.map((day) => all.find((e) => e.day === day)!).filter(Boolean) };
}

/** Calendario del diario para la portada: las 24 noches, abiertas las que ya cuenta Chispa y cerradas las demás (sin adelantar nada). */
export function diaryCalendar(now: Date): { mode: 'sample' | 'live' | 'all'; entries: DiaryEntry[]; days: { day: number; open: boolean }[] } {
  const { mode, entries } = diaryFor(now);
  const total = elfNights().length;
  const open = new Set(mode === 'sample' ? [] : entries.map((e) => e.day));
  return { mode, entries, days: Array.from({ length: total }, (_, i) => ({ day: i + 1, open: open.has(i + 1) })) };
}
