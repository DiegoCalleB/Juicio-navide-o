import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CopyMessage } from '@/components/features/CopyMessage';
import { ShareBar } from '@/components/features/ShareBar';
import { ELF_HASHTAGS, elfNights, MESS_LABEL, nightDate } from '@/lib/elfIdeas';

const CTA_HREF = '/?personaje=duende_chispa#crear';

export function generateStaticParams() {
  return elfNights().map((n) => ({ noche: String(n.day) }));
}

async function findNight(param: string) {
  const n = Number(param);
  return Number.isInteger(n) ? elfNights().find((x) => x.day === n) : undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ noche: string }> }): Promise<Metadata> {
  const night = await findNight((await params).noche);
  if (!night) return { title: 'Trastada no encontrada' };
  const title = `Noche ${night.day} del elfo travieso: ${night.title}`;
  const description = `${night.idea} En ${night.minutes} minutos y con ${night.need.toLowerCase()}. Paso a paso y con el mensaje del elfo para tu peque.`;
  return {
    title,
    description,
    alternates: { canonical: `/ideas-elfo/${night.day}` },
    openGraph: { type: 'article', title, description, locale: 'es_ES', siteName: 'Línea Mágica' },
    twitter: { card: 'summary_large_image', title, description },
  };
}
export const viewport: Viewport = { themeColor: '#120822' };

export default async function NightPage({ params }: { params: Promise<{ noche: string }> }) {
  const night = await findNight((await params).noche);
  if (!night) notFound();
  const prev = night.day > 1 ? night.day - 1 : null;
  const next = night.day < 24 ? night.day + 1 : null;
  const shareText = `Trastada ${night.day} del elfo travieso: ${night.title}. ${night.why}`;
  const image = `/ideas-elfo/${night.day}/imagen`;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#120822] text-[#fff6dc]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <article className="relative mx-auto w-full max-w-xl px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-8 lg:max-w-5xl lg:px-8">
        <nav aria-label="Navegación" className="mb-6 flex items-center justify-between text-[13px]">
          <Link href="/ideas-elfo" className="font-semibold text-[#f6d77a]">← Las 24 trastadas</Link>
          <Link href="/" className="font-serif text-[16px] text-[#f6d77a]">✨ Línea Mágica</Link>
        </nav>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-[.2em] text-[#7ee2a8]">🧝 Trastada {night.day} de 24 · {nightDate(night.day)}</p>
            <h1 className="mt-2 font-serif text-[32px] leading-[1.1] lg:text-[44px]">{night.title}</h1>
            <p className="mt-3 text-[16.5px] leading-relaxed text-[#fff6dc]/85">{night.idea}</p>
            <ul className="mt-4 flex flex-wrap gap-2 text-[12.5px] font-semibold" aria-label="Ficha">
              <li className="rounded-full border border-[#7ee2a8]/40 bg-[#7ee2a8]/10 px-3 py-1 text-[#7ee2a8]">⏱ {night.minutes} min</li>
              <li className="rounded-full border border-[#f6d77a]/40 bg-[#f6d77a]/10 px-3 py-1 text-[#f6d77a]">🧹 {MESS_LABEL[night.mess]}</li>
              <li className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[#fff6dc]/85">🧺 {night.need}</li>
            </ul>

            <section aria-labelledby="como" className="mt-6 rounded-2xl border border-white/10 bg-[#1d0b3a]/70 p-4">
              <h2 id="como" className="text-[12px] font-bold uppercase tracking-wide text-[#fff6dc]/55">Cómo montarla</h2>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-[#fff6dc]/85">
                {night.steps.map((st) => <li key={st}>{st}</li>)}
              </ol>
              <p className="mt-3 rounded-xl bg-[#f6d77a]/10 px-3 py-2 text-[14px] italic leading-snug text-[#f6d77a]">😂 {night.why}</p>
            </section>

            <section className="mt-5 rounded-2xl border border-white/10 bg-[#1d0b3a]/70 p-4">
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#fff6dc]/55">El mensaje del elfo por la mañana</p>
              <blockquote className="mt-1.5 rounded-xl bg-[#fbf5e6] px-3.5 py-2.5 text-[16px] leading-snug text-[#3a2208]">{night.message}</blockquote>
              <p className="mt-2 text-[12.5px] text-[#fff6dc]/50">[nombre] es el nombre de tu peque. Cambia “Chispa” por el nombre de vuestro elfo.</p>
              <div className="mt-3"><CopyMessage text={night.message} /></div>
            </section>
          </div>

          <aside className="mt-6 lg:mt-0">
            <section aria-labelledby="comparte" className="rounded-2xl border border-[#f6d77a]/40 bg-[#f6d77a]/[.06] p-4">
              <h2 id="comparte" className="font-serif text-xl text-[#f6d77a]">Compártela</h2>
              <p className="mt-1 text-[13px] leading-snug text-[#fff6dc]/70">Con la imagen lista para Pinterest, Instagram o TikTok.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={`Ficha de la trastada ${night.day}: ${night.title}`} width={1000} height={1500} loading="lazy" className="mt-3 w-full rounded-xl border border-white/10" />
              <div className="mt-3"><ShareBar path={`/ideas-elfo/${night.day}`} text={shareText} title={`Trastada ${night.day} del elfo travieso`} image={image} hashtags={ELF_HASHTAGS} /></div>
              <p className="mt-3 text-[12px] leading-snug text-[#fff6dc]/55">¿Has montado la tuya? Súbela con <strong>#TrastadasDelElfo</strong>. Mejor sin la cara de tu peque.</p>
            </section>
          </aside>
        </div>

        <p className="mt-6 text-center text-[14px] text-[#fff6dc]/70">¿Hoy no te da la vida? <Link href="/ideas-elfo/sin-tiempo" className="font-semibold text-[#f6d77a] underline underline-offset-2">⚡ 15 trastadas en menos de un minuto</Link></p>

        <section className="mt-7 rounded-3xl border-2 border-[#f6d77a]/60 bg-gradient-to-b from-[#f6d77a]/[.13] to-transparent p-5 text-center">
          <p className="font-serif text-xl">Que el elfo se lo escriba de verdad</p>
          <p className="mx-auto mt-1.5 max-w-sm text-[14.5px] text-[#fff6dc]/75">Tu peque recibe este mensaje en su chat, con la foto de la trastada, y tú contestas como el elfo sin que se entere.</p>
          <Link href={CTA_HREF} className="mt-3.5 inline-flex min-h-12 items-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] px-6 font-bold text-[#2a0f4a]">Probar gratis</Link>
        </section>

        <nav aria-label="Noches" className="mt-7 flex justify-between gap-3 text-[14px]">
          {prev ? <Link href={`/ideas-elfo/${prev}`} className="rounded-xl border border-white/20 px-4 py-2.5 font-semibold">← Noche {prev}</Link> : <span />}
          {next ? <Link href={`/ideas-elfo/${next}`} className="rounded-xl border border-white/20 px-4 py-2.5 font-semibold">Noche {next} →</Link> : <span />}
        </nav>
      </article>
    </div>
  );
}
