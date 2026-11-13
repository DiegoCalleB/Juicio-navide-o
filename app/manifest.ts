import type { MetadataRoute } from 'next';

/** Manifiesto general de la app (portada). Las salas y la familia tienen el suyo, para abrirse donde toca. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Línea Mágica',
    short_name: 'Línea Mágica',
    description: 'Tu peque habla en directo con Papá Noel, los Reyes, el Ratoncito Pérez o un elfo travieso. Tú contestas en secreto desde tu móvil.',
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
      { name: 'Crear una sala', short_name: 'Crear sala', url: '/#crear', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Ideas de trastadas del elfo', short_name: 'Trastadas', url: '/ideas-elfo', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
    ],
  };
}
