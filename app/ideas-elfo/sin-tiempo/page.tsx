import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { CopyMessage } from '@/components/features/CopyMessage';
import { ShareBar } from '@/components/features/ShareBar';
import { ELF_HASHTAGS, elfQuick } from '@/lib/elfIdeas';

const TITLE = '15 trastadas del elfo para cuando no hay tiempo (o se te ha olvidado)';
const DESCRIPTION =
  'Trastadas exprés del elfo travieso: menos de un minuto y sin material, para las mañanas sin ganas, sin tiempo o de “¡se me ha olvidado mover el elfo!”. Con el mensaje del elfo para tu peque.';
const CTA_HREF = '/?personaje=duende_chispa#crear';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/ideas-elfo/sin-tiempo' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, locale: 'es_ES', siteName: 'Línea Mágica' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};
export const viewport: Viewport = { themeColor: '#120822' };

export default function SinTiempoPage() {
  const ideas = elfQuick();
  const image = '/ideas-elfo/sin-tiempo/imagen';
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#120822] text-[#fff6dc]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <article className="relative mx-auto w-full max-w-3xl px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-8 sm:px-6">
        <nav aria-label="Navegación" className="mb-6 flex items-center justify-between text-[13px]">
          <Link href="/ideas-elfo" className="font-semibold text-[#f6d77a]">← Las 24 trastadas</Link>
          <Link href="/" className="font-serif text-[16px] text-[#f6d77a]">✨ Línea Mágica</Link>
        </nav>

        <header>
          <p className="text-[11px] font-bold uppercase tracking-[.25em] text-[#f6d77a]">⚡ Plan de emergencia</p>
          <h1 className="mt-2 font-serif text-[32px] leading-[1.1] sm:text-[40px]">15 trastadas para cuando no hay tiempo (o se te ha olvidado)</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-[#fff6dc]/80">
            Son las 7:55, tu peque está a punto de levantarse y el elfo lleva tres días en la misma estantería. Respira. Todas se hacen
            en <strong>menos de un minuto</strong>, sin comprar nada, y vienen con el mensaje del elfo que lo explica todo.
          </p>
          <div className="mt-4">
            <ShareBar path="/ideas-elfo/sin-tiempo" text="Las 15 trastadas del elfo para cuando se te ha olvidado moverlo (todas en menos de un minuto):" title={TITLE} image={image} hashtags={ELF_HASHTAGS} />
          </div>
        </header>

        <ol className="mt-8 grid gap-3.5 sm:grid-cols-2" aria-label="Trastadas exprés">
          {ideas.map((q, i) => (
            <li key={q.id} id={q.id} className="scroll-mt-4 rounded-2xl border border-[#f6d77a]/25 bg-[#1d0b3a]/70 p-4">
              <p className="text-[11.5px] font-bold uppercase tracking-widest text-[#f6d77a]">⚡ Exprés {i + 1} de {ideas.length}</p>
              <h2 className="mt-1.5 font-serif text-[21px] leading-tight">{q.title}</h2>
              <p className="mt-1.5 text-[14.5px] leading-snug text-[#fff6dc]/85">{q.how}</p>
              <p className="mt-2 text-[13.5px] italic leading-snug text-[#7ee2a8]">😂 {q.joke}</p>
              <p className="mt-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-[#fff6dc]/50">Mensaje del elfo</p>
              <blockquote className="mt-1 rounded-xl bg-[#fbf5e6] px-3 py-2 text-[14.5px] leading-snug text-[#3a2208]">{q.message}</blockquote>
              <div className="mt-3"><CopyMessage text={q.message} /></div>
            </li>
          ))}
        </ol>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <h2 className="font-serif text-2xl text-[#f6d77a]">La regla de oro</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[#fff6dc]/80">
            Si un día el elfo no se mueve, no pasa nada: lo importante es que <strong>siempre haya una explicación divertida</strong>. Un elfo
            dormido, resfriado o en huelga es una historia; un elfo olvidado, no. Con eso, tu peque ni se dará cuenta.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border-2 border-[#f6d77a]/60 bg-gradient-to-b from-[#f6d77a]/[.13] to-transparent p-6 text-center">
          <p className="font-serif text-2xl">El truco definitivo para las mañanas con prisa</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-[#fff6dc]/75">Con Línea Mágica el elfo le escribe a tu peque en su chat. Lo programas la noche anterior y por la mañana le llega solo, con foto incluida.</p>
          <Link href={CTA_HREF} className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] px-6 font-bold text-[#2a0f4a]">Probar gratis</Link>
        </section>

        <p className="mt-8 text-center text-[14px]"><Link href="/ideas-elfo" className="font-semibold text-[#f6d77a] underline underline-offset-2">Ver las 24 trastadas con paso a paso →</Link></p>
      </article>
    </div>
  );
}
