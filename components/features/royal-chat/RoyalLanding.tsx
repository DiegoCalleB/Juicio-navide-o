import Link from 'next/link';
import { BRAND, heroFor } from '@/lib/brand';
import { CHARACTERS, resolveCharacter } from '@/lib/characters';
import { regionalize, type Locale } from '@/lib/i18n';
import { DemoChat } from './DemoChat';
import { LocaleSwitch } from './LocaleSwitch';
import type { BillingInfo } from './PassOffer';
import { demoFor } from './demoData';

export function RoyalLanding({ locale, now }: { billing?: BillingInfo; locale: Locale; now: Date }) {
  // REGLA DE ORO (AGENTS.md): la portada es pública y la puede ver un peque. Solo magia: ni cómo funciona,
  // ni precios, ni quién escribe. Todo eso vive tras la puerta (/mayores). El botón vistoso lleva al diario de Chispa
  // y el acceso de los mayores es un enlace pequeño y aburrido a propósito: así un peque curioso no lo busca.
  const r = (t: string) => regionalize(t, locale);
  const hero = heroFor(now);
  const demoCharacter = hero.phase === 'elf' || hero.phase === 'elf-pre' ? 'duende_chispa' : hero.phase === 'reyes' ? 'melchor' : hero.phase === 'raton' ? 'raton_perez' : 'papa_noel';
  const demoGroup = demoCharacter === 'duende_chispa' ? 'duende' : demoCharacter === 'melchor' ? 'reyes' : demoCharacter === 'raton_perez' ? 'raton' : 'noel';
  const demo = resolveCharacter(CHARACTERS[demoCharacter], { alias: 'Chispa', gender: 'm', locale });
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#120822]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <div className="relative mx-auto w-full max-w-md px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 lg:max-w-6xl lg:px-10 lg:pt-10">
        <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:py-8">
        <header className="mb-6 text-center lg:mb-0 lg:text-left">
          <p className="font-serif text-[20px] leading-none text-[#f6d77a]">{BRAND}</p>
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[.22em] text-[#f6d77a]/75">{hero.tagline}</p>
          <h1 className="mt-4 font-serif text-[30px] leading-[1.12] text-[#fff6dc] lg:mt-8 lg:text-[56px] lg:leading-[1.06]">{hero.title}</h1>
          {hero.countdown && (
            <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full lg:mx-0 lg:mt-5 border border-[#7ee2a8]/50 bg-[#7ee2a8]/10 px-3 py-1 text-[12.5px] font-bold text-[#7ee2a8]">
              {hero.countdown}
            </p>
          )}
          <p className="mx-auto mt-3 max-w-[22rem] text-[15px] leading-relaxed text-[#fff6dc]/75 lg:mx-0 lg:mt-5 lg:max-w-lg lg:text-[19px]">
            {r(hero.subtitle)}
          </p>
          <Link href="/diario-de-chispa" className="mt-5 flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a] shadow-lg transition hover:brightness-105 active:scale-[0.99] lg:mt-8 lg:inline-flex lg:min-h-14 lg:px-10 lg:text-[17px]">
            Lee el diario de Chispa
          </Link>
          <ul aria-label="Rincones del Polo Norte" className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
            {([['chistes', 'Chistes del elfo'], ['adivinanzas', 'Adivinanzas'], ['renos', 'Los renos'], ['mapa', 'El mapa']] as const).map(([id, label]) => (
              <li key={id}>
                <Link href={`/polo-norte#${id}`} className="inline-flex min-h-9 items-center rounded-full border border-[#f6d77a]/35 px-3.5 text-[13px] font-semibold text-[#f6d77a]/90">{label}</Link>
              </li>
            ))}
          </ul>
        </header>

        <section aria-labelledby="demo-title" className="mb-8 lg:mx-auto lg:mb-0 lg:w-full lg:max-w-[26rem]">
          <h2 id="demo-title" className="mb-2.5 text-center text-[12px] font-semibold uppercase tracking-widest text-[#fff6dc]/55">
            Un mensaje {demo.deName}
          </h2>
          <DemoChat embedded character={demo} childName="Lucía" initial={demoFor(demoGroup)} />
        </section>
        </div>

        <footer className="mt-6 space-y-3 border-t border-white/10 pt-5 text-center text-[12.5px] text-[#fff6dc]/45">
          <LocaleSwitch />
          <nav aria-label="Más" className="flex justify-center">
            <Link href="/mayores" className="text-[11px] text-[#fff6dc]/35 underline-offset-2 hover:underline">Cuenta y condiciones</Link>
          </nav>
          <p>Con cariño, desde el Polo Norte.</p>
        </footer>
      </div>
    </div>
  );
}
