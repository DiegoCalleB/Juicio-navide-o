import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { BRAND, heroFor } from '@/lib/brand';
import { billingInfo } from '@/lib/billing';
import { isCharacterId } from '@/lib/characters';
import { siteNow } from '@/lib/clock';
import { CreateRoomForm } from '@/components/features/royal-chat/CreateRoomForm';
import { PassWelcome } from '@/components/features/royal-chat/PassWelcome';

export const dynamic = 'force-dynamic';
export const viewport: Viewport = { themeColor: '#1d0b3a' };
export const metadata: Metadata = { title: 'Abre el portal mágico de tu peque', robots: { index: false, follow: true } };

/** Abrir el portal, paso a paso (1: el peque · 2: el personaje). /crear?personaje=duende_chispa deja elegido al personaje. */
export default async function CrearPage({ searchParams }: { searchParams: Promise<{ personaje?: string }> }) {
  const { personaje } = await searchParams;
  const initialCharacter = personaje && isCharacterId(personaje) ? personaje : undefined;
  const billing = billingInfo();
  return (
    <div data-scroll-root className="fixed inset-0 z-40 overflow-y-auto bg-[#120822]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <div className="relative mx-auto w-full max-w-md px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 lg:max-w-2xl lg:pt-10">
        <nav className="mb-5 flex items-center justify-between">
          <Link href="/" className="min-h-10 rounded-full border border-white/15 px-3 py-2 text-[13px] font-semibold text-[#fff6dc]/80 active:scale-95">← Inicio</Link>
          <p className="font-serif text-[17px] text-[#f6d77a]">{BRAND}</p>
          <Link href="/precios" className="min-h-10 rounded-full px-2 py-2 text-[13px] font-semibold text-[#f6d77a]/85 underline underline-offset-2">Precios</Link>
        </nav>
        <PassWelcome />
        <section id="crear" aria-label="Abrir el portal">
          <CreateRoomForm billing={billing} defaultCharacter={heroFor(siteNow()).defaultCharacter} initialCharacter={initialCharacter} />
        </section>
      </div>
    </div>
  );
}
