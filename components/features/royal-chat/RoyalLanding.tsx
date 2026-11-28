import Link from 'next/link';
import { BRAND, heroFor } from '@/lib/brand';
import { CHARACTERS, resolveCharacter } from '@/lib/characters';
import { regionalize, type Locale } from '@/lib/i18n';
import type { AgeKind } from '@/lib/adultGate';
import { ChispaEdadTarjeta } from './ChispaEdadTarjeta';
import { DemoChat } from './DemoChat';
import { DiarioEnPortada } from './DiarioEnPortada';
import { LocaleSwitch } from './LocaleSwitch';
import type { BillingInfo } from './PassOffer';
import { demoFor } from './demoData';

export function RoyalLanding({ locale, now, age = null }: { billing?: BillingInfo; locale: Locale; now: Date; age?: AgeKind | null }) {
  // REGLA DE ORO (AGENTS.md): la portada es pública y la puede ver un peque. Solo magia: ni cómo funciona,
  // ni precios, ni quién escribe. Todo eso vive tras la puerta (/mayores). El botón vistoso lleva al diario de Chispa
  // y el acceso de los mayores son dos enlaces normales pero aburridos («Mi cuenta» arriba y «Condiciones de uso» abajo) que solo aparecen cuando Chispa ha preguntado la edad y la respuesta es de mayor.
  const r = (t: string) => regionalize(t, locale);
  const hero = heroFor(now);
  const demoCharacter = hero.phase === 'elf' || hero.phase === 'elf-pre' ? 'duende_chispa' : hero.phase === 'reyes' ? 'melchor' : hero.phase === 'raton' ? 'raton_perez' : 'papa_noel';
  const demoGroup = demoCharacter === 'duende_chispa' ? 'duende' : demoCharacter === 'melchor' ? 'reyes' : demoCharacter === 'raton_perez' ? 'raton' : 'noel';
  const demo = resolveCharacter(CHARACTERS[demoCharacter], { alias: 'Chispa', gender: 'm', locale });
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#120822]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <div className="relative mx-auto w-full max-w-md px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 lg:max-w-6xl lg:px-10 lg:pt-6">
        {age === 'ok' && (
          <div className="mb-3 flex justify-end lg:mb-0">
            <Link href="/mayores" className="inline-flex min-h-10 items-center px-1 text-[13.5px] text-[#fff6dc]/65 underline-offset-2 hover:underline">Mi cuenta</Link>
          </div>
        )}
        <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:py-8">
        <header className="mb-6 text-center lg:mb-0 lg:text-left">
          <div className="flex items-center justify-center gap-2.5 lg:justify-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-128.png" width={44} height={44} alt="" className="size-11 shrink-0 rounded-full shadow-[0_2px_14px_rgba(246,215,122,.25)]" />
            <p className="font-serif text-[22px] leading-none text-[#f6d77a]">{BRAND}</p>
          </div>
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[.22em] text-[#f6d77a]/75">{hero.tagline}</p>
          <h1 className="mt-4 font-serif text-[30px] leading-[1.12] text-[#fff6dc] lg:mt-8 lg:text-[56px] lg:leading-[1.06]">{hero.title}</h1>
          {hero.countdown && (
            <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full lg:mx-0 lg:mt-5 border border-[#7ee2a8]/50 bg-[#7ee2a8]/10 px-3 py-1 text-[12.5px] font-bold text-[#7ee2a8]">
              {hero.countdown}
            </p>
          )}
          <p className="mx-auto mt-3 max-w-[22rem] text-[15px] leading-relaxed text-[#fff6dc]/75 lg:mx-0 lg:mt-5 lg:max-w-lg lg:text-[19px]">
            {r(age === 'ok' ? 'Abre el portal de tu peque en un minuto: Papá Noel, los Reyes Magos, Chispa o el Ratoncito Pérez le escriben por su nombre, en directo, al móvil de casa.' : hero.subtitle)}
          </p>
          {age === 'ok' ? (
            <>
              <Link href="/crear" className="mt-5 flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] text-[17px] font-extrabold text-[#2a0f4a] shadow-lg transition hover:brightness-105 active:scale-[0.99] lg:mt-8 lg:inline-flex lg:min-h-14 lg:px-10">
                Crear el portal de mi peque
              </Link>
              <p className="mt-2 text-[13.5px] text-[#fff6dc]/70">Pruébalo 3 días gratis, sin tarjeta.</p>
              <Link href="/diario-de-chispa" className="mt-3 inline-flex min-h-10 items-center text-[14px] font-semibold text-[#f6d77a]/90 underline underline-offset-2">Lee el diario de Chispa</Link>
            </>
          ) : (
            <Link href="/diario-de-chispa" className="mt-5 flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a] shadow-lg transition hover:brightness-105 active:scale-[0.99] lg:mt-8 lg:inline-flex lg:min-h-14 lg:px-10 lg:text-[17px]">
              Lee el diario de Chispa
            </Link>
          )}
          <ul aria-label="Rincones del Polo Norte" className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
            {([['chistes', 'Chistes del elfo'], ['adivinanzas', 'Adivinanzas'], ['renos', 'Los renos'], ['mapa', 'El mapa']] as const).map(([id, label]) => (
              <li key={id}>
                <Link href={`/polo-norte#${id}`} className="inline-flex min-h-9 items-center rounded-full border border-[#f6d77a]/35 px-3.5 text-[13px] font-semibold text-[#f6d77a]/90">{label}</Link>
              </li>
            ))}
          </ul>
          {age === null && <ChispaEdadTarjeta />}
        </header>

        <section aria-labelledby="demo-title" className="mb-8 lg:mx-auto lg:mb-0 lg:w-full lg:max-w-[26rem]">
          <h2 id="demo-title" className="mb-2.5 text-center text-[12px] font-semibold uppercase tracking-widest text-[#fff6dc]/55">
            Un mensaje {demo.deName}
          </h2>
          <DemoChat embedded character={demo} childName="Lucía" initial={demoFor(demoGroup)} />
        </section>
        </div>

        {age === 'ok' && (
          <section aria-labelledby="pasos-title" className="mb-8">
            <h2 id="pasos-title" className="mb-3 text-center font-serif text-[24px] text-[#f6d77a]">Así de fácil</h2>
            <ol className="mx-auto grid max-w-md gap-2.5 lg:max-w-4xl lg:grid-cols-3">
              {([
                ['1', 'Abres su portal', 'Solo el nombre de pila de tu peque y quién quieres que le escriba. Un minuto.'],
                ['2', 'Le das su enlace', 'Un enlace privado, solo suyo. Chispa o Papá Noel le saludan por su nombre.'],
                ['3', 'Tú pones lo que le cuentan', 'Con su nombre, sus gustos y sus anécdotas. Tú eliges cuándo llega y si lleva voz.'],
              ] as const).map(([n, t, d]) => (
                <li key={n} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.05] p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f6d77a] text-[17px] font-extrabold text-[#2a0f4a]">{n}</span>
                  <span>
                    <span className="block text-[16px] font-bold text-[#fff6dc]">{t}</span>
                    <span className="mt-0.5 block text-[13.5px] leading-snug text-[#fff6dc]/75">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <Link href="/crear" className="mx-auto mt-4 flex min-h-14 max-w-md items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] text-[17px] font-extrabold text-[#2a0f4a] shadow-lg active:scale-[0.99]">
              Crear el portal de mi peque
            </Link>
            <p className="mt-2 text-center text-[13px] text-[#fff6dc]/60">Privado y sin cuentas. <Link href="/prueba" className="underline underline-offset-2">Ver cómo funciona</Link></p>
          </section>
        )}

        <DiarioEnPortada now={now} />

        <footer className="mt-6 space-y-3 border-t border-white/10 pt-5 text-center text-[12.5px] text-[#fff6dc]/45">
          <LocaleSwitch />
          {age === 'ok' && (
            <nav aria-label="Más" className="flex justify-center">
              <Link href="/terminos" className="inline-flex min-h-10 items-center text-[13px] text-[#fff6dc]/60 underline-offset-2 hover:underline">Condiciones de uso</Link>
            </nav>
          )}
          <p>Con cariño, desde el Polo Norte.</p>
        </footer>
      </div>
    </div>
  );
}
