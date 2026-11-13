import 'server-only';
import { NextResponse } from 'next/server';

interface ManifestInput {
  name: string;
  shortName: string;
  description: string;
  /** Ruta de inicio (y alcance) de la app instalada: la sala, el panel o la familia. */
  path: string;
  icons: { src: string; sizes: string; purpose?: 'any' | 'maskable' }[];
  themeColor?: string;
}

/** Manifiesto de una sala/panel/familia concreta: al instalarla, la app abre ESA pantalla (no la portada). Nunca se cachea. */
export function manifestResponse(m: ManifestInput): NextResponse {
  const body = {
    id: m.path,
    name: m.name,
    short_name: m.shortName,
    description: m.description,
    lang: 'es',
    start_url: m.path,
    scope: m.path,
    display: 'standalone',
    background_color: '#120822',
    theme_color: m.themeColor ?? '#2a0f4a',
    icons: m.icons.map((i) => ({ ...i, type: 'image/png', purpose: i.purpose ?? 'any' })),
  };
  return new NextResponse(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'private, no-store, max-age=0', 'Referrer-Policy': 'no-referrer' },
  });
}

export const BRAND_ICONS: ManifestInput['icons'] = [
  { src: '/icons/icon-192.png', sizes: '192x192' },
  { src: '/icons/icon-512.png', sizes: '512x512' },
  { src: '/icons/icon-maskable-512.png', sizes: '512x512', purpose: 'maskable' },
];

export const characterIcons = (id: string): ManifestInput['icons'] => [
  { src: `/icons/characters/${id}-192.png`, sizes: '192x192' },
  { src: `/icons/characters/${id}-512.png`, sizes: '512x512' },
  { src: `/icons/characters/${id}-maskable-512.png`, sizes: '512x512', purpose: 'maskable' },
];
