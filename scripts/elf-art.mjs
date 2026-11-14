#!/usr/bin/env node
// Convierte una ilustración generada (PNG) en la versión que sirve la web: JPEG 1024x768, ~100 KB.
//   node scripts/elf-art.mjs <origen.png> <noche>
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const [src, day] = process.argv.slice(2);
if (!src || !/^\d{1,2}$/.test(day ?? '')) {
  console.error('Uso: node scripts/elf-art.mjs <origen.png> <noche 1-24>');
  process.exit(1);
}
mkdirSync('public/elfo/trastadas', { recursive: true });
const out = `public/elfo/trastadas/${Number(day)}.jpg`;
const info = await sharp(src).resize(1024, 768, { fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
console.log(`${out} · ${Math.round(info.size / 1024)} KB`);
