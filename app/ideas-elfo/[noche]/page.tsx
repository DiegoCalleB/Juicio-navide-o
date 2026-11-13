import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CopyMessage } from '@/components/features/CopyMessage';
import { ShareBar } from '@/components/features/ShareBar';
import { elfNights, nightDate, shortIdea } from '@/lib/elfIdeas';

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
  const title = `Noche ${night.day} del elfo travieso: ${shortIdea(night.idea)}`;
  const description = `Idea de trastada para la noche del ${nightDate(night.day)} y el mensaje que el elfo puede dejar a tu peque: “${night.message}”`;
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
  const shareText = `Noche ${night.day} del elfo travieso: ${shortIdea(night.idea)}.`;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#120822] text-[#fff6dc]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <article className="relative mx-auto w-full max-w-xl px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-8">
        <nav aria-label="Navegación" className="mb-6 flex items-center justify-between text-[13px]">
          <Link href="/ideas-elfo" className="font-semibold text-[#f6d77a]">← Las 24 trastadas</Link>
          <Link href="/" className="font-serif text-[16px] text-[#f6d77a]">✨ Línea Mágica</Link>
        </nav>

        <p className="text-[11.5px] font-bold uppercase tracking-[.2em] text-[#7ee2a8]">🧝 Noche {night.day} de 24 · {nightDate(night.day)}</p>
        <h1 className="mt-2 font-serif text-[30px] leading-[1.15]">{night.idea}</h1>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#1d0b3a]/70 p-4">
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#fff6dc]/50">Mensaje del elfo</p>
          <blockquote className="mt-1.5 rounded-xl bg-[#fbf5e6] px-3.5 py-2.5 text-[16px] leading-snug text-[#3a2208]">{night.message}</blockquote>
          <p className="mt-2 text-[12.5px] text-[#fff6dc]/50">[nombre] es el nombre de tu peque. Cambia “Chispa” por el nombre de vuestro elfo.</p>
          <div className="mt-3"><CopyMessage text={night.message} /></div>
        </section>

        <section className="mt-5">
          <p className="mb-1.5 text-[12.5px] font-semibold text-[#fff6dc]/60">Compártelo con otras familias</p>
          <ShareBar path={`/ideas-elfo/${night.day}`} text={shareText} title={`Noche ${night.day} del elfo travieso`} />
        </section>

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
