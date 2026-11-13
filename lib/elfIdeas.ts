import { CHARACTERS, fillChild, resolveCharacter } from '@/lib/characters';

export interface ElfNight {
  day: number;
  /** Qué montar por la noche. */
  idea: string;
  /** Mensaje de ejemplo del elfo ([nombre] es el nombre del peque). */
  message: string;
}

/** Las 24 trastadas (la misma fuente que usa el panel de los padres), listas para páginas públicas. */
export function elfNights(): ElfNight[] {
  const elf = resolveCharacter(CHARACTERS.duende_chispa, { alias: 'Chispa', gender: 'm', locale: 'es' });
  return (elf.mischief?.days ?? []).map((d) => ({ day: d.day, idea: d.idea, message: fillChild(d.suggestion, '[nombre]') }));
}

export const nightDate = (day: number) => `${day} de diciembre`;

/** Texto corto sin punto final, para títulos. */
export const shortIdea = (idea: string) => idea.replace(/\.$/, '').replace(/\s*\([^)]*\)\s*$/, '');
