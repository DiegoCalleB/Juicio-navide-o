import type { Metadata, Viewport } from 'next';
import { BajaForm } from './BajaForm';
import { readUnsubscribe } from '@/lib/contacts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Baja del correo', robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: '#0a1220' };

/** Baja de los correos de novedades. Neutra y breve: solo la ve quien llega desde un correo. */
export default async function BajaPage({ searchParams }: { searchParams: Promise<{ e?: string; s?: string }> }) {
  const { e, s } = await searchParams;
  const valid = !!readUnsubscribe(e, s);
  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-10 text-center text-[#e8f1ff]">
      <h1 className="text-2xl font-extrabold">Baja del correo</h1>
      {valid ? <BajaForm e={e!} s={s!} /> : <p>Este enlace no es válido o ya ha caducado.</p>}
    </main>
  );
}
