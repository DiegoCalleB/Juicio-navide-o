import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mensajería Mágica de Navidad',
    short_name: 'Mensajería Mágica',
    description: 'Que antes de abrir los regalos, hable con Papá Noel: tu hijo escribe y tú contestas desde tu móvil, en directo.',
    lang: 'es',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#120822',
    theme_color: '#2a0f4a',
    categories: ['kids', 'entertainment', 'social'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
