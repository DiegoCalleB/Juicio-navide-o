import { CHARACTERS, fillChild, resolveCharacter } from '@/lib/characters';

export interface ElfNight {
  day: number;
  /** Título corto y con gracia. */
  title: string;
  /** Qué montar por la noche. */
  idea: string;
  steps: string[];
  need: string;
  minutes: number;
  mess: 1 | 2 | 3;
  why: string;
  /** Mensaje de ejemplo del elfo ([nombre] es el nombre del peque). */
  message: string;
}

/** Las 24 trastadas (la misma fuente que usa el panel de los padres), listas para páginas públicas. */
export function elfNights(): ElfNight[] {
  const elf = resolveCharacter(CHARACTERS.duende_chispa, { alias: 'Chispa', gender: 'm', locale: 'es' });
  return (elf.mischief?.days ?? []).map((d) => ({
    day: d.day,
    title: d.title,
    idea: d.idea,
    steps: d.steps.map((s) => fillChild(s, '[nombre]')),
    need: d.need,
    minutes: d.minutes,
    mess: d.mess,
    why: d.why,
    message: fillChild(d.suggestion, '[nombre]'),
  }));
}

export const nightDate = (day: number) => `${day} de diciembre`;

/** Texto corto sin punto final, para títulos. */
export const shortIdea = (idea: string) => idea.replace(/\.$/, '').replace(/\s*\([^)]*\)\s*$/, '');

export const MESS_LABEL: Record<1 | 2 | 3, string> = { 1: 'Poco lío', 2: 'Algo de lío', 3: 'Lío gordo' };

/** Etiquetas para redes. */
export const ELF_HASHTAGS = '#ElfoTravieso #TrastadasDelElfo #Navidad';

export interface QuickNight {
  id: string;
  title: string;
  how: string;
  joke: string;
  message: string;
}

/** Las 15 trastadas exprés (sin tiempo, sin ganas o se ha olvidado). */
export function elfQuick(): QuickNight[] {
  const elf = resolveCharacter(CHARACTERS.duende_chispa, { alias: 'Chispa', gender: 'm', locale: 'es' });
  return (elf.mischief?.quick ?? []).map((q) => ({ id: q.id, title: q.title, how: q.how, joke: q.joke, message: fillChild(q.suggestion, '[nombre]') }));
}
