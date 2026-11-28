import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { PLACES, REINDEER, RIDDLES } from '@/lib/poloNorte';
import { trackEntry } from '@/lib/metrics';
import { ChisteDelElfo } from '@/components/features/ChisteDelElfo';

export const viewport: Viewport = { themeColor: '#0d2b3a' };
export const metadata: Metadata = {
  title: 'El Polo Norte de Chispa',
  description: 'Chistes del elfo, adivinanzas, los renos y un paseo por el mapa del Polo Norte.',
  alternates: { canonical: '/polo-norte' },
};

const NAV = [
  ['chistes', 'Chistes'],
  ['adivinanzas', 'Adivinanzas'],
  ['renos', 'Los renos'],
  ['mapa', 'El mapa'],
] as const;

/** Página pública para los curiosos: pura magia, sin formularios ni datos (AGENTS.md). */
export default async function PoloNortePage({ searchParams }: { searchParams: Promise<{ src?: string }> }) {
  await trackEntry('polo_norte_vista', (await searchParams).src);
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#0d2b3a] text-[#fff6dc]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <main className="relative mx-auto w-full max-w-md px-4 pb-12 pt-6 lg:max-w-3xl lg:pt-10">
        <nav className="mb-6 flex items-center justify-between text-[13px]">
          <Link href="/" className="font-serif text-[17px] text-[#f6d77a]">{BRAND}</Link>
          <Link href="/diario-de-chispa" className="font-semibold text-[#7ee2a8] underline underline-offset-2">Diario de Chispa</Link>
        </nav>
        <header className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-[.22em] text-[#7ee2a8]">Bienvenido al</p>
          <h1 className="mt-2 font-serif text-[34px] leading-tight lg:text-[46px]">Polo Norte de Chispa</h1>
          <p className="mx-auto mt-3 max-w-md text-[15.5px] leading-relaxed text-[#fff6dc]/80">
            ¡Hola! Soy Chispa. Pasa, pasa, que aquí hay de todo: chistes malísimos, adivinanzas, renos con mucho carácter y un mapa de mi casa.
          </p>
          <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Rincones">
            {NAV.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="inline-flex min-h-10 items-center rounded-full border border-[#f6d77a]/40 px-4 text-[14px] font-semibold text-[#f6d77a]">{label}</a>
              </li>
            ))}
          </ul>
        </header>

        <section id="chistes" aria-labelledby="t-chistes" className="mt-10 scroll-mt-4">
          <h2 id="t-chistes" className="mb-3 text-center font-serif text-[26px]">Los chistes del elfo</h2>
          <ChisteDelElfo />
        </section>

        <section id="adivinanzas" aria-labelledby="t-adivinanzas" className="mt-12 scroll-mt-4">
          <h2 id="t-adivinanzas" className="mb-1 text-center font-serif text-[26px]">Adivinanzas</h2>
          <p className="mb-4 text-center text-[14px] text-[#fff6dc]/70">Piénsalo bien antes de mirar la respuesta.</p>
          <ol className="space-y-3">
            {RIDDLES.map((r) => (
              <li key={r.q}>
                <details className="group rounded-2xl border border-[#f6d77a]/25 bg-[#081d27]/80 p-4">
                  <summary className="cursor-pointer list-none font-serif text-[18px] leading-snug">{r.q}</summary>
                  <p className="mt-3 font-serif text-[18px] italic text-[#7ee2a8]">{r.a}</p>
                </details>
              </li>
            ))}
          </ol>
        </section>

        <section id="renos" aria-labelledby="t-renos" className="mt-12 scroll-mt-4">
          <h2 id="t-renos" className="mb-4 text-center font-serif text-[26px]">Mis renos</h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {REINDEER.map((d) => (
              <li key={d.name} className="rounded-2xl border border-[#f6d77a]/25 bg-[#081d27]/80 p-4">
                <p className="font-serif text-[20px] text-[#f6d77a]">{d.name}</p>
                <p className="mt-1 text-[15px] leading-snug text-[#fff6dc]/85">{d.line}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="mapa" aria-labelledby="t-mapa" className="mt-12 scroll-mt-4">
          <h2 id="t-mapa" className="mb-1 text-center font-serif text-[26px]">El mapa del Polo Norte</h2>
          <p className="mb-4 text-center text-[14px] text-[#fff6dc]/70">Toca un sitio para ver qué hay dentro.</p>
          <ul className="space-y-3">
            {PLACES.map((p) => (
              <li key={p.name}>
                <details className="rounded-2xl border border-[#f6d77a]/25 bg-[#081d27]/80 p-4">
                  <summary className="cursor-pointer list-none font-serif text-[19px] text-[#f6d77a]">{p.name}</summary>
                  <p className="mt-2 text-[15px] leading-snug text-[#fff6dc]/85">{p.text}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-12 border-t border-white/10 pt-5 text-center text-[12.5px] text-[#fff6dc]/45">
          <nav className="flex justify-center gap-5">
            <Link href="/" className="underline-offset-2 hover:underline">Inicio</Link>
            <Link href="/diario-de-chispa" className="underline-offset-2 hover:underline">Diario de Chispa</Link>
          </nav>
          <p className="mt-3">Con cariño, desde el Polo Norte.</p>
        </footer>
      </main>
    </div>
  );
}
