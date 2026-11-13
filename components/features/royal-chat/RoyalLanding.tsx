import Link from 'next/link';
import { BRAND, heroFor } from '@/lib/brand';
import { CHARACTERS, resolveCharacter, type CharacterId } from '@/lib/characters';
import { regionalize, type Locale } from '@/lib/i18n';
import { CreateRoomForm } from './CreateRoomForm';
import { DemoChat } from './DemoChat';
import { InstallApp } from '@/components/features/InstallApp';
import { LocaleSwitch } from './LocaleSwitch';
import { MyRooms } from './MyRooms';
import type { BillingInfo } from './PassOffer';
import { PassWelcome } from './PassWelcome';
import { PricingSection } from './PricingSection';
import { demoFor } from './demoData';

export function RoyalLanding({ billing, locale, now, initialCharacter }: { billing: BillingInfo; locale: Locale; now: Date; initialCharacter?: CharacterId }) {
  const r = (t: string) => regionalize(t, locale);
  const hero = heroFor(now);
  const demoCharacter = hero.phase === 'elf' || hero.phase === 'elf-pre' ? 'duende_chispa' : hero.phase === 'reyes' ? 'melchor' : hero.phase === 'raton' ? 'raton_perez' : 'papa_noel';
  const demoGroup = demoCharacter === 'duende_chispa' ? 'duende' : demoCharacter === 'melchor' ? 'reyes' : demoCharacter === 'raton_perez' ? 'raton' : 'noel';
  const perks = ['En directo', 'Sin registrarte', billing.enabled ? 'Gratis 3 días' : 'Gratis', 'Para primeros lectores'];
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#120822]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <div className="relative mx-auto w-full max-w-md px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 lg:max-w-6xl lg:px-10 lg:pt-10">
        {billing.enabled && billing.campaign && (
          <a href="#pase" className="mx-auto mb-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl lg:max-w-3xl border border-[#f6d77a]/70 bg-black/70 px-3 py-2 text-center text-[13px] font-bold leading-tight text-[#fff6dc] active:scale-[0.99]">
            <span aria-hidden>🖤</span>
            <span><span className="text-[#f6d77a]">{billing.campaign.label}</span> · Pase de Navidad a {billing.price} hasta el {billing.campaign.until}</span>
            <span aria-hidden className="text-[#f6d77a]">→</span>
          </a>
        )}
        <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:py-8">
        <header className="mb-6 text-center lg:mb-0 lg:text-left">
          <p className="font-serif text-[20px] leading-none text-[#f6d77a]">✨ {BRAND}</p>
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[.22em] text-[#f6d77a]/75">{hero.tagline}</p>
          <h1 className="mt-4 font-serif text-[30px] leading-[1.12] text-[#fff6dc] lg:mt-8 lg:text-[56px] lg:leading-[1.06]">{hero.title}</h1>
          {hero.countdown && (
            <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full lg:mx-0 lg:mt-5 border border-[#7ee2a8]/50 bg-[#7ee2a8]/10 px-3 py-1 text-[12.5px] font-bold text-[#7ee2a8]">
              <span aria-hidden>🎄</span> {hero.countdown}
            </p>
          )}
          <p className="mx-auto mt-3 max-w-[22rem] text-[15px] leading-relaxed text-[#fff6dc]/75 lg:mx-0 lg:mt-5 lg:max-w-lg lg:text-[19px]">
            {r(hero.subtitle)}
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-1.5 lg:mt-6 lg:justify-start lg:gap-2" aria-label="Ventajas">
            {perks.map((p) => (
              <li key={p} className="rounded-full border border-[#f6d77a]/30 bg-[#f6d77a]/[.07] px-2.5 py-1 text-[11.5px] font-semibold text-[#f6d77a]/90">{p}</li>
            ))}
          </ul>
          <a href="#crear" className="mt-5 flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a] shadow-lg transition hover:brightness-105 active:scale-[0.99] lg:mt-8 lg:inline-flex lg:min-h-14 lg:px-10 lg:text-[17px]">
            Crear la sala de mi peque
          </a>
          {(hero.phase === 'elf' || hero.phase === 'elf-pre') && (
            <Link href="/ideas-elfo" className="mt-2.5 block text-[13.5px] font-semibold text-[#7ee2a8] underline underline-offset-2 lg:mt-4">
              🧝 Ver las 24 trastadas del elfo (gratis)
            </Link>
          )}
          {billing.enabled && (
            <a href="#pase" className="mt-2.5 inline-block text-[13px] text-[#f6d77a]/85 underline underline-offset-2 lg:ml-5">
              Ver el Pase de Navidad · {billing.price}
            </a>
          )}
        </header>

        <section aria-labelledby="demo-title" className="mb-8 lg:mx-auto lg:mb-0 lg:w-full lg:max-w-[26rem]">
          <h2 id="demo-title" className="mb-2.5 text-center text-[12px] font-semibold uppercase tracking-widest text-[#fff6dc]/55">
            Así lo verá tu peque · pruébalo
          </h2>
          <DemoChat embedded character={resolveCharacter(CHARACTERS[demoCharacter], { alias: 'Chispa', gender: 'm', locale })} childName="Lucía" initial={demoFor(demoGroup)} />
        </section>
        </div>

        <div className="lg:mx-auto lg:max-w-2xl">
          <PassWelcome />
          <MyRooms />
        </div>

        <PricingSection billing={billing} />

        <section id="crear" aria-label="Crear la sala" className="scroll-mt-4 lg:mx-auto lg:max-w-2xl">
          <CreateRoomForm billing={billing} defaultCharacter={hero.defaultCharacter} initialCharacter={initialCharacter} />
        </section>

        <div className="mt-8">
          <InstallApp />
        </div>

        <footer className="mt-6 space-y-3 border-t border-white/10 pt-5 text-center text-[12.5px] text-[#fff6dc]/45">
          <LocaleSwitch />
          <nav aria-label="Información legal" className="flex justify-center gap-5">
            <Link href="/privacidad" className="underline-offset-2 hover:underline">Privacidad</Link>
            <Link href="/ideas-elfo" className="underline-offset-2 hover:underline">Trastadas del elfo</Link>
            <Link href="/terminos" className="underline-offset-2 hover:underline">Términos de uso</Link>
          </nav>
          <p>No somos Papá Noel ni los Reyes Magos, pero hacemos lo que podemos ✨</p>
        </footer>
      </div>
    </div>
  );
}
