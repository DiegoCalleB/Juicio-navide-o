import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { CopyMessage } from '@/components/features/CopyMessage';
import { ShareBar } from '@/components/features/ShareBar';
import { AI_ART_NOTE, elfArt } from '@/lib/elfArt';
import { ELF_HASHTAGS, elfNights, MESS_LABEL, nightDate } from '@/lib/elfIdeas';

const TITLE = 'Las 24 mejores trastadas del elfo travieso (los clásicos de internet)';
const DESCRIPTION =
  'Los clásicos de internet del elfo de Navidad: tirolina, pesca en el váter, la puerta envuelta… Una trastada por noche del 1 al 24 de diciembre, paso a paso, con el material y el mensaje del elfo para tu peque.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/ideas-elfo' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, locale: 'es_ES', siteName: 'Línea Mágica' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};
export const viewport: Viewport = { themeColor: '#120822' };

const CTA_HREF = '/?personaje=duende_chispa#crear';

const FAQ = [
  {
    q: '¿Cuándo llega el elfo travieso?',
    a: 'Lo más habitual es que llegue a casa el 1 de diciembre y se quede hasta Nochebuena, pero cada familia elige su fecha. Estas ideas valen para cualquier día de inicio: simplemente empieza por la noche 1.',
  },
  {
    q: '¿Qué hago si un día no tengo tiempo o se me olvida?',
    a: 'Nada grave: el elfo puede “quedarse dormido” en el mismo sitio y avisar en su mensaje de que anoche estaba muy cansado. Lo importante es que siga siendo divertido, no una obligación.',
  },
  {
    q: '¿Son ideas seguras?',
    a: 'Elige siempre las que no tengan riesgo en tu casa. Evita velas, cosas calientes, cuerdas o alturas donde un peque pueda subirse a imitarlo, y no pegues nada que dañe la pintura o los muebles.',
  },
  {
    q: '¿Cómo hago que el elfo le escriba a mi peque?',
    a: 'Con Línea Mágica: tu peque abre un chat en su móvil o tablet y recibe los mensajes del elfo, que escribes tú en secreto desde tu móvil, con la foto de la trastada. Puedes probarlo gratis.',
  },
];

export default function IdeasElfoPage() {
  const days = elfNights();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        name: TITLE,
        description: DESCRIPTION,
        numberOfItems: days.length,
        itemListElement: days.map((d) => ({ '@type': 'ListItem', position: d.day, name: `Noche ${d.day}: ${d.title}` })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  };
  const shareText = 'Las 24 mejores trastadas del elfo travieso, una por noche y con el mensaje del elfo. Ya tengo plan para diciembre:';

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#120822] text-[#fff6dc]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <article className="relative mx-auto w-full max-w-3xl px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-8 sm:px-6">
        <nav aria-label="Navegación" className="mb-6 flex items-center justify-between text-[13px]">
          <Link href="/" className="font-serif text-[18px] text-[#f6d77a]">✨ Línea Mágica</Link>
          <Link href={CTA_HREF} className="rounded-full border border-[#f6d77a]/50 px-3 py-1 font-semibold text-[#f6d77a]">Que el elfo le escriba</Link>
        </nav>

        <header>
          <p className="text-[11px] font-bold uppercase tracking-[.25em] text-[#7ee2a8]">🧝 Ideas gratis para Navidad</p>
          <h1 className="mt-2 font-serif text-[32px] leading-[1.1] sm:text-[40px]">Las 24 mejores trastadas del elfo travieso</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-[#fff6dc]/80">
            Los clásicos que más se repiten en internet (la tirolina, la pesca en el váter, la puerta envuelta…), elegidos y adaptados
            para que sean <strong>baratos, seguros y rápidos</strong>. Una por noche, del 1 al 24 de diciembre, con el paso a paso y el
            <strong> mensaje</strong> que el elfo deja a tu peque por la mañana.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href={CTA_HREF} className="flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] px-5 font-bold text-[#2a0f4a] active:scale-[0.99]">
              Que el elfo escriba a mi peque
            </Link>
          </div>
          <div className="mt-3">
            <p className="mb-1.5 text-[12.5px] font-semibold text-[#fff6dc]/60">Compártelo con otras familias</p>
            <ShareBar path="/ideas-elfo" text={shareText} title={TITLE} hashtags={ELF_HASHTAGS} />
          </div>
        </header>

        <Link href="/ideas-elfo/sin-tiempo" className="mt-6 flex items-center gap-3 rounded-2xl border border-[#f6d77a]/50 bg-[#f6d77a]/[.08] p-4 active:scale-[0.99]">
          <span aria-hidden className="text-3xl">⚡</span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-[#f6d77a]">¿Se te ha olvidado mover el elfo?</span>
            <span className="block text-[13.5px] text-[#fff6dc]/75">15 trastadas de emergencia en menos de un minuto, sin material.</span>
          </span>
          <span aria-hidden className="text-[#f6d77a]">→</span>
        </Link>

        <section aria-labelledby="como" className="mt-8 rounded-3xl border border-white/10 bg-white/[.04] p-5">
          <h2 id="como" className="font-serif text-2xl text-[#f6d77a]">Cómo usar esta lista</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-[#fff6dc]/80">
            <li><strong>Prepara la escena por la noche</strong>, cuando tu peque duerma. Casi todas se montan en menos de cinco minutos.</li>
            <li><strong>Haz una foto</strong> de la trastada para guardarla de recuerdo.</li>
            <li><strong>Deja el mensaje del elfo</strong>: en una nota, o escrito por ti en un chat para que lo lea tu peque al despertar.</li>
            <li>Cámbiale el nombre al elfo por el vuestro. Aquí lo llamamos <em>Chispa</em>.</li>
            <li><strong>Compártela</strong> con <strong>#TrastadasDelElfo</strong> (mejor sin la cara de tu peque): cada trastada tiene su imagen lista para Pinterest, Instagram y TikTok.</li>
          </ol>
          <p className="mt-3 rounded-xl bg-[#f6d77a]/10 p-3 text-[13.5px] leading-snug text-[#fff6dc]/85">
            🛟 <strong>Seguridad:</strong> elige solo las ideas sin riesgo en tu casa. Nada de velas, cosas calientes, cuerdas o alturas que tu peque pueda querer imitar, y no pegues nada que dañe la pintura.
          </p>
        </section>

        <section aria-labelledby="lista" className="mt-10">
          <h2 id="lista" className="font-serif text-2xl text-[#f6d77a]">Las 24 noches</h2>
          <p className="mt-1 text-[13.5px] text-[#fff6dc]/60">En los mensajes, <strong>[nombre]</strong> es el nombre de tu peque.</p>
          <ol className="mt-4 grid gap-3.5 sm:grid-cols-2">
            {days.map((d, i) => {
              const message = d.message;
              return (
                <li key={d.day} className="contents">
                  <article id={`noche-${d.day}`} className="scroll-mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#1d0b3a]/70 p-4">
                    {(() => {
                      const art = elfArt(d.day);
                      return art ? (
                        <Link href={`/ideas-elfo/${d.day}`} className="-mx-4 -mt-4 mb-3 block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={art.src} width={art.width} height={art.height} alt={`Ilustración: ${d.title}`} title={AI_ART_NOTE} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                        </Link>
                      ) : null;
                    })()}
                    <p className="text-[11.5px] font-bold uppercase tracking-widest text-[#7ee2a8]">Noche {d.day} · {nightDate(d.day)}</p>
                    <h3 className="mt-1.5 font-serif text-[21px] leading-tight"><Link href={`/ideas-elfo/${d.day}`} className="hover:underline">{d.title}</Link></h3>
                    <p className="mt-1.5 text-[14px] leading-snug text-[#fff6dc]/80">{d.idea}</p>
                    <p className="mt-2 text-[12px] font-semibold text-[#fff6dc]/55">⏱ {d.minutes} min · 🧹 {MESS_LABEL[d.mess]} · 🧺 {d.need}</p>
                    <p className="mt-2 text-[13.5px] italic leading-snug text-[#f6d77a]">😂 {d.why}</p>
                    <p className="mt-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-[#fff6dc]/50">Mensaje del elfo</p>
                    <blockquote className="mt-1 rounded-xl bg-[#fbf5e6] px-3 py-2 text-[14.5px] leading-snug text-[#3a2208]">{message}</blockquote>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <CopyMessage text={message} />
                      <ShareBar path={`/ideas-elfo/${d.day}`} text={`Trastada ${d.day} del elfo travieso: ${d.title}. ${d.why}`} title={`Trastada ${d.day} del elfo travieso`} image={`/ideas-elfo/${d.day}/imagen`} hashtags={ELF_HASHTAGS} compact />
                    </div>
                  </article>
                  {(i + 1) % 8 === 0 && i + 1 < days.length && (
                    <div className="rounded-2xl border border-[#f6d77a]/40 bg-[#f6d77a]/[.08] p-4 sm:col-span-2">
                      <p className="font-bold text-[#f6d77a]">¿Y si el elfo le escribe de verdad?</p>
                      <p className="mt-1 text-[14px] text-[#fff6dc]/80">Tu peque lo recibe en su chat, con la foto de la trastada, y tú contestas como el elfo sin que se entere.</p>
                      <Link href={CTA_HREF} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#f6d77a] px-4 font-bold text-[#2a0f4a]">Probar gratis</Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="font-serif text-2xl text-[#f6d77a]">Preguntas frecuentes</h2>
          <dl className="mt-3 space-y-3">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <dt className="font-bold">{f.q}</dt>
                <dd className="mt-1 text-[14.5px] leading-relaxed text-[#fff6dc]/75">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10 rounded-3xl border-2 border-[#f6d77a]/60 bg-gradient-to-b from-[#f6d77a]/[.13] to-transparent p-6 text-center">
          <p className="font-serif text-2xl">Que el elfo le escriba a tu peque</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-[#fff6dc]/75">Línea Mágica es un chat donde tu peque habla con el elfo en directo. Tú escribes sus mensajes en secreto y le mandas la foto de cada trastada.</p>
          <Link href={CTA_HREF} className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] px-6 font-bold text-[#2a0f4a]">Crear la sala del elfo</Link>
        </section>

        <footer className="mt-10 border-t border-white/10 pt-5 text-center text-[12.5px] text-[#fff6dc]/45">
          <nav aria-label="Información legal" className="flex justify-center gap-5">
            <Link href="/privacidad" className="hover:underline">Privacidad</Link>
            <Link href="/terminos" className="hover:underline">Términos de uso</Link>
          </nav>
          <p className="mt-2">Línea Mágica no está afiliada a ninguna marca de elfos de Navidad.</p>
        </footer>
      </article>
    </div>
  );
}
