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
import { DEMO_NOEL } from './demoData';

export function RoyalLanding({ billing, locale }: { billing: BillingInfo; locale: Locale }) {
  const r = (t: string) => regionalize(t, locale);
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#120822]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <div className="relative mx-auto w-full max-w-md px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10">
        <header className="mb-6 text-center">
          <p className="font-serif text-[22px] leading-none text-[#f6d77a]">✨ {BRAND}</p>
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[.22em] text-[#f6d77a]/80">{seasonTagline()}</p>
          <h1 className="mt-3 font-serif text-[32px] leading-tight text-[#fff6dc]">Que antes de abrir los regalos, hable con Papá Noel</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#fff6dc]/70">
            Tu peque le escribe a Papá Noel, a los Reyes Magos, al Ratoncito Pérez o a un duende travieso y recibe su respuesta en directo. {r('Tú la escribes desde tu móvil y a él le llega como si fuera el personaje.')}
          </p>
          <p className="mx-auto mt-3 inline-block rounded-full border border-[#f6d77a]/40 bg-[#f6d77a]/10 px-3 py-1 text-[12.5px] font-semibold text-[#f6d77a]">
            📖 Ideal para primeros lectores: ¡querrá leer cada mensaje!
          </p>
        </header>

        <section aria-labelledby="demo-title" className="mb-8">
          <h2 id="demo-title" className="mb-3 text-center text-[13px] font-semibold uppercase tracking-widest text-[#fff6dc]/60">
            Esto es lo que verá tu hijo · pruébalo
          </h2>
          <DemoChat embedded character={resolveCharacter(CHARACTERS.papa_noel, { locale })} childName="Lucía" initial={DEMO_NOEL} />
        </section>

        <LocaleSwitch />
        <PassWelcome />
        <MyRooms />

        <div className="mb-3 text-center">
          <h2 className="font-serif text-2xl text-[#fff6dc]">Crea la sala de tu peque</h2>
          <p className="mt-1 text-[14px] text-[#fff6dc]/60">Gratis, sin registrarte. Tarda un minuto. Puedes crear una sala por cada peque o personaje.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#1d0b3a]/80 p-5 shadow-2xl backdrop-blur">
          <CreateRoomForm billing={billing} />
        </div>
        <ol className="mt-8 space-y-3 text-[14px] leading-snug text-[#fff6dc]/75">
          <li><span className="font-bold text-[#f6d77a]">1.</span> Crea la sala con el nombre de tu peque y elige quién le contesta.</li>
          <li><span className="font-bold text-[#f6d77a]">2.</span> {r('Abre su enlace en el móvil o tablet que usará.')}</li>
          <li><span className="font-bold text-[#f6d77a]">3.</span> Desde tu panel secreto de padres, lee lo que escribe y contesta como si fueras él. Guarda ese enlace: es la única llave.</li>
        </ol>

        <footer className="mt-10 border-t border-white/10 pt-5 text-center text-[12.5px] text-[#fff6dc]/45">
          <nav aria-label="Información legal" className="flex justify-center gap-5">
            <Link href="/privacidad" className="underline-offset-2 hover:underline">Privacidad</Link>
            <Link href="/terminos" className="underline-offset-2 hover:underline">Términos de uso</Link>
          </nav>
          <p className="mt-2">No somos Papá Noel ni los Reyes Magos, pero hacemos lo que podemos ✨</p>
        </footer>
      </div>
    </div>
  );
}
