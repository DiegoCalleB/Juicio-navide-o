import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { billingInfo } from '@/lib/billing';
import { PricingSection } from '@/components/features/royal-chat/PricingSection';

export const dynamic = 'force-dynamic';
export const viewport: Viewport = { themeColor: '#1d0b3a' };
export const metadata: Metadata = { title: 'Precios · Prueba gratis y Pase de Navidad' };

export default function PreciosPage() {
  const billing = billingInfo();
  return (
    <div data-scroll-root className="fixed inset-0 z-40 overflow-y-auto bg-[#120822]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <div className="relative mx-auto w-full max-w-md px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 lg:max-w-5xl lg:pt-10">
        <nav className="mb-6 flex items-center justify-between">
          <Link href="/" className="min-h-10 rounded-full border border-white/15 px-3 py-2 text-[13px] font-semibold text-[#fff6dc]/80 active:scale-95">← Inicio</Link>
          <p className="font-serif text-[17px] text-[#f6d77a]">✨ {BRAND}</p>
          <span className="w-16" />
        </nav>
        {billing.enabled ? (
          <PricingSection billing={billing} />
        ) : (
          <p className="text-center text-[15px] text-[#fff6dc]/80">Ahora mismo es gratis.</p>
        )}
        <p className="mt-6 text-center">
          <Link href="/crear" className="inline-flex min-h-12 items-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] px-6 font-bold text-[#2a0f4a]">Crear la sala de mi peque</Link>
        </p>
      </div>
    </div>
  );
}
