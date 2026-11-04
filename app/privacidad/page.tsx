import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Privacidad' };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-lg font-extrabold text-court-gold">{title}</h2>
    <div className="space-y-2 text-[15px] leading-relaxed text-court-snow/80">{children}</div>
  </section>
);

export default function PrivacidadPage() {
  return (
    <article className="space-y-6 py-4">
      <header>
        <h1 className="text-3xl font-black">Privacidad</h1>
        <p className="mt-2 text-court-snow/70">Esta app está pensada para que los padres creen una conversación mágica con sus hijos. Te contamos qué guardamos y por qué.</p>
      </header>

      <Section title="Quién usa la app">
        <p>La crean y la gestionan los padres, madres o tutores. El niño solo ve su chat a través de un enlace privado que le da un adulto.</p>
      </Section>

      <Section title="Qué datos guardamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>El nombre de pila del niño (nunca apellidos) y el personaje elegido.</li>
          <li>Los mensajes escritos y las fotos que se envían en la conversación.</li>
          <li>Un identificador técnico anónimo (hash) para limitar abusos. No es reversible.</li>
        </ul>
        <p>No pedimos cuentas, correos, teléfonos, direcciones ni ubicación, y no usamos publicidad ni cookies de seguimiento.</p>
      </Section>

      <Section title="Quién puede verlo">
        <p>Solo quien tenga el enlace del niño o el enlace de los padres. Los enlaces son largos y aleatorios; si crees que alguien más lo tiene, crea una sala nueva. Las fotos se guardan en un almacén privado y se sirven con enlaces temporales.</p>
      </Section>

      <Section title="Cuánto tiempo lo guardamos">
        <p>Las conversaciones se borran automáticamente a los 45 días de crearse, junto con sus fotos.</p>
      </Section>

      <Section title="Tus derechos">
        <p>Puedes pedir en cualquier momento que borremos una conversación o resolver dudas sobre tus datos. Indica el enlace del panel de los padres para localizarla.</p>
      </Section>

      <p className="text-sm text-court-snow/50">
        Texto informativo. Antes de lanzar públicamente, revísalo con un profesional y completa los datos del responsable y su contacto.
      </p>
      <Link href="/" className="inline-flex min-h-12 items-center rounded-2xl bg-court-gold px-5 font-bold text-court-bg">Volver al inicio</Link>
    </article>
  );
}
