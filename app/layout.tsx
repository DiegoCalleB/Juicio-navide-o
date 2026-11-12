import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { LocaleProvider } from '@/components/LocaleProvider';
import { getRequestLocale } from '@/lib/i18n.server';
import { getSiteUrl } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: 'Línea Mágica · Tu peque habla en directo con Papá Noel', template: '%s · Línea Mágica' },
  description: 'Que antes de abrir los regalos, hable con Papá Noel: tu hijo le escribe y tú contestas desde tu móvil, en directo.',
  openGraph: { type: 'website', siteName: 'Línea Mágica', locale: 'es_ES' },
  twitter: { card: 'summary_large_image' },
  appleWebApp: { capable: true, title: 'Línea Mágica', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: '#2a0f4a', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <body className="min-h-dvh font-sans">
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
          <LocaleProvider locale={locale}>{children}</LocaleProvider>
        </main>
      </body>
    </html>
  );
}
