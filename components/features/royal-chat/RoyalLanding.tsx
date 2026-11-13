import Link from 'next/link';
import { BRAND, seasonTagline } from '@/lib/brand';
import { CHARACTERS, resolveCharacter } from '@/lib/characters';
import { regionalize, type Locale } from '@/lib/i18n';
import { CreateRoomForm } from './CreateRoomForm';
import { DemoChat } from './DemoChat';
import { LocaleSwitch } from './LocaleSwitch';
import { MyRooms } from './MyRooms';
import type { BillingInfo } from './PassOffer';
import { PassWelcome } from './PassWelcome';
import { PricingSection } from './PricingSection';
import { DEMO_NOEL } from './demoData';

export function RoyalLanding({ billing, locale }: { billing: BillingInfo; locale: Locale }) {
  const r = (t: string) => regionalize(t, locale);
  const perks = ['En directo', 'Sin registrarte', billing.enabled ? 'Gratis 3 días' : 'Gratis', 'Para primeros lectores'];
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#120822]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <div className="relative mx-auto w-full max-w-md px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8">
        <header className="mb-6 text-center">
          <p className="font-serif text-[20px] leading-none text-[#f6d77a]">✨ {BRAND}</p>
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[.22em] text-[#f6d77a]/75">{seasonTagline()}</p>
          <h1 className="mt-4 font-serif text-[30px] leading-[1.12] text-[#fff6dc]">Que antes de abrir los regalos, hable con Papá Noel</h1>
          <p className="mx-auto mt-3 max-w-[22rem] text-[15px] leading-relaxed text-[#fff6dc]/75">
            {r('Tu peque le escribe y tú contestas en secreto desde tu móvil. A él le llega como si fuera el personaje.')}
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-1.5" aria-label="Ventajas">
            {perks.map((p) => (
              <li key={p} className="rounded-full border border-[#f6d77a]/30 bg-[#f6d77a]/[.07] px-2.5 py-1 text-[11.5px] font-semibold text-[#f6d77a]/90">{p}</li>
            ))}
          </ul>
          <a href="#crear" className="mt-5 flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a] shadow-lg active:scale-[0.99]">
            Crear la sala de mi peque
          </a>
          {billing.enabled && (
            <a href="#pase" className="mt-2.5 inline-block text-[13px] text-[#f6d77a]/85 underline underline-offset-2">
              Ver el Pase de Navidad · {billing.price}
            </a>
          )}
        </header>

        <PassWelcome />
        <MyRooms />

        <section aria-labelledby="demo-title" className="mb-8">
          <h2 id="demo-title" className="mb-2.5 text-center text-[12px] font-semibold uppercase tracking-widest text-[#fff6dc]/55">
            Así lo verá tu peque · pruébalo
          </h2>
          <DemoChat embedded character={resolveCharacter(CHARACTERS.papa_noel, { locale })} childName="Lucía" initial={DEMO_NOEL} />
        </section>

        <PricingSection billing={billing} />

        <section id="crear" aria-label="Crear la sala" className="scroll-mt-4">
          <CreateRoomForm billing={billing} />
        </section>

        <footer className="mt-10 space-y-3 border-t border-white/10 pt-5 text-center text-[12.5px] text-[#fff6dc]/45">
          <LocaleSwitch />
          <nav aria-label="Información legal" className="flex justify-center gap-5">
            <Link href="/privacidad" className="underline-offset-2 hover:underline">Privacidad</Link>
            <Link href="/terminos" className="underline-offset-2 hover:underline">Términos de uso</Link>
          </nav>
          <p>No somos Papá Noel ni los Reyes Magos, pero hacemos lo que podemos ✨</p>
        </footer>
      </div>
    </div>
  );
}
