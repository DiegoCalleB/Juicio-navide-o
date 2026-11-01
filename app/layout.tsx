import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { clientEnv } from '@/lib/env';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
  title: { default: 'Juicio Navideño', template: '%s · Juicio Navideño' },
  description: 'Lleva a tu cuñado, suegra o amigo secreto a juicio esta Navidad. Crea el caso y que firme el jurado.',
  openGraph: { type: 'website', siteName: 'Juicio Navideño', locale: 'es_ES' },
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
