import type { MetadataRoute } from 'next';

/** Manifiesto general de la app (portada). Las salas y la familia tienen el suyo, para abrirse donde toca. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Línea Mágica',
    short_name: 'Línea Mágica',
    description: 'Mensajes en directo de Papá Noel, los Reyes Magos, el elfo Chispa y el Ratoncito Pérez.',
    lang: 'es',
    start_url: '/?utm_source=pwa',
    scope: '/',
    display: 'standalone',
    background_color: '#120822',
    theme_color: '#2a0f4a',
    categories: ['kids', 'entertainment', 'social'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Diario de Chispa', short_name: 'Diario', url: '/diario-de-chispa', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Zona de mayores', short_name: 'Mayores', url: '/mayores', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
    ],
  };
}
