import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { siteNow } from '@/lib/clock';
import { diaryFor } from '@/lib/elfDiary';
import { elfArt } from '@/lib/elfArt';
import { ShareBar } from '@/components/features/ShareBar';

export const dynamic = 'force-dynamic';
export const viewport: Viewport = { themeColor: '#0d2b3a' };
export const metadata: Metadata = {
  title: 'Diario de travesuras del elfo Chispa',
  description: 'Lo que ha hecho el elfo Chispa cada noche de diciembre, contado por él mismo.',
  alternates: { canonical: '/diario-de-chispa' },
};

/** Página pública: la magia, nunca el truco (AGENTS.md). */
export default function DiarioPage() {
  const { mode, entries } = diaryFor(siteNow());
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#0d2b3a] text-[#fff6dc]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <article className="relative mx-auto w-full max-w-md px-4 pb-12 pt-6 lg:max-w-3xl lg:pt-10">
        <nav className="mb-6 flex items-center justify-between text-[13px]">
          <Link href="/" className="font-serif text-[17px] text-[#f6d77a]">{BRAND}</Link>
        </nav>
        <header className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-[.22em] text-[#7ee2a8]">Escrito por Chispa</p>
          <h1 className="mt-2 font-serif text-[32px] leading-tight lg:text-[46px]">Mi diario de travesuras</h1>
          <p className="mx-auto mt-3 max-w-md text-[15.5px] leading-relaxed text-[#fff6dc]/80">
            {mode === 'sample'
              ? '¡Hola! Soy Chispa, el elfo más travieso del Polo Norte. El 1 de diciembre vuelvo a viajar. Mientras tanto, aquí tienes unas páginas de mi diario del año pasado.'
              : '¡Hola! Soy Chispa. Cada noche hago una trastada y la apunto aquí. ¿Adivinas qué haré mañana? ¡Ni se te ocurra intentarlo!'}
          </p>
          <div className="mx-auto mt-5 flex justify-center">
            <ShareBar path="/diario-de-chispa" title="Diario de travesuras del elfo Chispa" text="El diario de travesuras del elfo Chispa, contado por él mismo:" compact />
          </div>
        </header>

        <ol className="mt-8 space-y-5" aria-label="Páginas del diario">
          {entries.map((e) => {
            const art = elfArt(e.day);
            return (
              <li key={e.day} id={`noche-${e.day}`} className="overflow-hidden rounded-3xl border border-[#f6d77a]/25 bg-[#081d27]/80">
                {art && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={art.src} width={art.width} height={art.height} alt={e.title} loading={e === entries[0] ? 'eager' : 'lazy'} className="aspect-[4/3] w-full object-cover" />
                )}
                <div className="p-4 lg:p-6">
                  <p className="text-[11.5px] font-bold uppercase tracking-widest text-[#f6d77a]">{mode === 'sample' ? 'Del año pasado' : `Noche del ${e.day} de diciembre`}</p>
                  <h2 className="mt-1 font-serif text-[22px] leading-tight">{e.title}</h2>
                  <p className="mt-2 font-serif text-[17px] italic leading-relaxed text-[#fff6dc]/90">«{e.text}»</p>
                  <p className="mt-2 text-right text-[13px] text-[#7ee2a8]">— Chispa</p>
                </div>
              </li>
            );
          })}
        </ol>

        <footer className="mt-10 border-t border-white/10 pt-5 text-center text-[12.5px] text-[#fff6dc]/45">
          <nav className="flex justify-center gap-5">
            <Link href="/" className="underline-offset-2 hover:underline">Inicio</Link>
            <Link href="/mayores" className="underline-offset-2 hover:underline">Mi cuenta</Link>
          </nav>
        </footer>
      </article>
    </div>
  );
}
