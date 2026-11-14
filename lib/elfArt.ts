import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Ilustraciones (creadas con IA) de cada trastada: public/elfo/trastadas/N.jpg (1024x768).
 * Son opcionales: si una noche aún no tiene ilustración, las páginas funcionan igual sin ella.
 */
const dir = () => path.join(process.cwd(), 'public', 'elfo', 'trastadas');

export interface ElfArt {
  src: string;
  width: number;
  height: number;
}

export function elfArt(day: number): ElfArt | null {
  return existsSync(path.join(dir(), `${day}.jpg`)) ? { src: `/elfo/trastadas/${day}.jpg`, width: 1024, height: 768 } : null;
}

/** Para dibujarla dentro de las imágenes generadas (vista previa, Pinterest). */
export function elfArtDataUri(day: number): string | null {
  const file = path.join(dir(), `${day}.jpg`);
  return existsSync(file) ? `data:image/jpeg;base64,${readFileSync(file).toString('base64')}` : null;
}

export const AI_ART_NOTE = 'Ilustración creada con IA';
