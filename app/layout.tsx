import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { getSiteUrl } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: 'Mensajería Mágica de Navidad', template: '%s · Mensajería Mágica de Navidad' },
  description: 'Que antes de abrir los regalos, hable con Papá Noel: tu hijo le escribe y tú contestas desde tu móvil, en directo.',
  openGraph: { type: 'website', siteName: 'Mensajería Mágica de Navidad', locale: 'es_ES' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = { themeColor: '#0a1a12', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh font-sans">
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
