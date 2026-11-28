import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { billingInfo } from '@/lib/billing';
import { trackEntry } from '@/lib/metrics';

export const dynamic = 'force-dynamic';
export const viewport: Viewport = { themeColor: '#1d0b3a' };
// Zona de mayores (detrás de la puerta): explica qué recibe el peque y por qué es privado. Nunca en el mundo público.
export const metadata: Metadata = { title: 'Pruébalo gratis · Papá Noel para tu peque', robots: { index: false, follow: false } };

const PASOS = [
  { n: '1', t: 'Abres su portal', d: 'En un minuto: solo el nombre de pila de tu peque y quién quieres que le escriba.' },
  { n: '2', t: 'Le das su enlace', d: 'Un enlace privado, solo suyo. Chispa le saluda por su nombre.' },
  { n: '3', t: 'Escribes lo que le cuenta Papá Noel', d: 'Con su nombre, sus gustos y sus anécdotas. Tú eliges cuándo llega y, si quieres, con la voz del personaje.' },
];

const CONFIANZA = [
  ['Entra solo quien tú elijas', 'Es un enlace privado, largo y aleatorio. No hay buscador, ni perfiles, ni cuentas: nadie puede encontrar a tu peque.'],
  ['Sin cuentas, teléfonos ni ubicación', 'Solo el nombre de pila de tu peque (nunca apellidos). Ni direcciones, ni teléfono, ni dónde está.'],
  ['Sin cámara', 'No usa la cámara de tu peque ni graba vídeo suyo.'],
  ['Se borra solo', 'Las conversaciones, con sus fotos y audios, se eliminan a los 45 días o pasadas las fiestas.'],
  ['Tú mandas', 'Puedes cambiar su enlace cuando quieras y pedir que se borre una conversación en cualquier momento.'],
];

const PREGUNTAS = [
  ['¿Quién escribe los mensajes?', 'Tú. Los mensajes los escribes tú desde tu panel, con tu estilo, y los dice el personaje. Solo entra al chat quien tenga su enlace privado: no hay cuentas ni forma de buscar a nadie.'],
  ['¿Qué datos guardáis?', 'El nombre de pila, el personaje elegido y los mensajes de la conversación. Nada más. Todo se borra solo a los 45 días o pasadas las fiestas.'],
  ['¿Hace falta tarjeta para probarlo?', 'No. La prueba es de 3 días y no se paga nada. Solo si quieres seguir después, eliges el Pase.'],
  ['¿Es una suscripción?', 'No. Es un pago único y no hay nada que cancelar.'],
];

export default async function PruebaPage({ searchParams }: { searchParams: Promise<{ src?: string }> }) {
  const { src } = await searchParams;
  await trackEntry('prueba_vista', src);
  const billing = billingInfo();
  const cta = (
    <Link href="/crear" className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] px-6 text-[17px] font-extrabold text-[#2a0f4a] shadow-lg active:scale-[0.99]">
      Pruébalo gratis 3 días
    </Link>
  );
  return (
    <div data-scroll-root className="fixed inset-0 z-40 overflow-y-auto bg-[#120822] text-[#fff6dc]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <div className="relative mx-auto w-full max-w-md px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-5 lg:max-w-3xl lg:pt-10">
        <nav className="mb-6 flex items-center justify-between">
          <Link href="/" className="min-h-10 rounded-full border border-white/15 px-3 py-2 text-[13px] font-semibold text-[#fff6dc]/80 active:scale-95">← Inicio</Link>
          <p className="flex items-center gap-2 font-serif text-[17px] text-[#f6d77a]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-128.png" width={32} height={32} alt="" className="size-8 rounded-full" />
            {BRAND}
          </p>
          <span className="w-16" />
        </nav>

        <header className="text-center">
          <h1 className="font-serif text-[30px] leading-tight text-[#fff6dc] lg:text-[44px]">Papá Noel le escribe a tu peque esta Navidad</h1>
          <p className="mx-auto mt-3 max-w-sm text-[15.5px] leading-snug text-[#fff6dc]/80">Un chat mágico, privado y 100 % personalizado: tú escribes lo que dice. Pruébalo 3 días gratis.</p>
          <div className="mx-auto mt-5 max-w-sm">{cta}</div>
        </header>

        <section aria-labelledby="mira" className="mt-9 grid gap-5 lg:grid-cols-2 lg:items-center">
          <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-3xl border-2 border-[#f6d77a]/60 shadow-xl">
            <video src="/prueba/carta-lucia.mp4" poster="/prueba/carta-lucia.jpg" controls playsInline preload="metadata" className="block w-full" aria-label="Lo que recibe tu peque: la respuesta de Papá Noel en su móvil" />
          </div>
          <div>
            <h2 id="mira" className="font-serif text-[22px] text-[#f6d77a]">Esto es lo que recibe tu peque</h2>
            <p className="mt-2 text-[14.5px] leading-snug text-[#fff6dc]/80">Un chat con Papá Noel en su móvil o tablet: le saluda por su nombre, le escribe y le habla con su voz. Sin llamadas, sin vídeos, sin desconocidos.</p>
          </div>
        </section>

        <section aria-labelledby="personal" className="mt-10 rounded-3xl border-2 border-[#f6d77a]/60 bg-[#f6d77a]/[.07] p-5">
          <h2 id="personal" className="text-center font-serif text-[24px] text-[#f6d77a]">100 % personalizado</h2>
          <p className="mt-2 text-center text-[15px] leading-snug text-[#fff6dc]/90">
            Nadie conoce a tu peque como tú. Por eso <strong>los mensajes los escribes tú</strong>, a tu manera, y los dice Papá Noel, los Reyes o el elfo travieso: su nombre, su perro, su cole, lo que ha hecho esta semana…
          </p>
          <ul className="mt-3 space-y-1.5 text-[13.5px] leading-snug text-[#fff6dc]/80">
            <li>✓ Tú decides qué dice, cuándo llega y si lleva voz.</li>
            <li>✓ Si vas con prisa, tienes mensajes ya preparados que puedes cambiar.</li>
            <li>✓ Lo que tu peque cuenta te llega a ti y contestas cuando quieras.</li>
          </ul>
        </section>

        <section aria-labelledby="pasos" className="mt-10">
          <h2 id="pasos" className="mb-3 text-center font-serif text-[24px] text-[#f6d77a]">Así de fácil</h2>
          <ol className="space-y-2.5">
            {PASOS.map((p) => (
              <li key={p.n} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.05] p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f6d77a] text-[18px] font-extrabold text-[#2a0f4a]">{p.n}</span>
                <span>
                  <span className="block text-[16.5px] font-bold">{p.t}</span>
                  <span className="mt-0.5 block text-[14px] leading-snug text-[#fff6dc]/75">{p.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="seguro" className="mt-10">
          <h2 id="seguro" className="mb-3 text-center font-serif text-[24px] text-[#f6d77a]">Y es privado</h2>
          <ul className="space-y-2.5">
            {CONFIANZA.map(([t, d]) => (
              <li key={t} className="rounded-2xl border border-[#7ee2a8]/25 bg-[#7ee2a8]/[.06] p-4">
                <span className="block text-[15.5px] font-bold text-[#bff3d6]">✓ {t}</span>
                <span className="mt-0.5 block text-[13.5px] leading-snug text-[#fff6dc]/75">{d}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-[12.5px] text-[#fff6dc]/55">
            Más detalle en la <Link href="/privacidad" className="underline underline-offset-2">política de privacidad</Link>.
          </p>
        </section>

        <section aria-labelledby="coste" className="mt-10 rounded-3xl border-2 border-[#f6d77a]/60 bg-[#f6d77a]/[.07] p-5 text-center">
          <h2 id="coste" className="font-serif text-[22px] text-[#f6d77a]">Primero pruébalo gratis</h2>
          <p className="mt-2 text-[14.5px] leading-snug text-[#fff6dc]/85">
            3 días sin pagar nada, sin tarjeta. Si te gusta, sigues hasta el 20 de enero con el Pase de Navidad
            {billing.enabled ? <> por <strong className="text-[#fff6dc]">{billing.price}</strong>, pago único</> : ', ahora mismo gratis'}.
            {billing.enabled && billing.campaign ? <> <span className="font-semibold text-[#f6d77a]">{billing.campaign.label}</span> hasta el {billing.campaign.until}.</> : null}
            {billing.enabled && billing.launchNote ? <> <span className="font-semibold text-[#f6d77a]">Oferta de lanzamiento {billing.launchNote}.</span></> : null}
          </p>
          <div className="mx-auto mt-4 max-w-sm">{cta}</div>
        </section>

        <section aria-labelledby="faq" className="mt-10">
          <h2 id="faq" className="mb-3 text-center font-serif text-[24px] text-[#f6d77a]">Preguntas rápidas</h2>
          <div className="space-y-2">
            {PREGUNTAS.map(([q, a]) => (
              <details key={q} className="group rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3">
                <summary className="cursor-pointer list-none text-[15px] font-semibold marker:content-none">{q}</summary>
                <p className="mt-2 text-[13.5px] leading-snug text-[#fff6dc]/75">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-8 text-center">
          <Link href="/mayores" className="text-[13px] text-[#fff6dc]/55 underline underline-offset-2">Volver a mi cuenta</Link>
        </p>
      </div>
    </div>
  );
}
