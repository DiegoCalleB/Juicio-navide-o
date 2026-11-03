import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { getSiteUrl } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: 'Mensajería Real de Oriente', template: '%s · Mensajería Real de Oriente' },
  description: 'Tu hijo escribe o manda notas de voz a su Rey Mago favorito… y el Rey le contesta.',
  openGraph: { type: 'website', siteName: 'Mensajería Real de Oriente', locale: 'es_ES' },
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
