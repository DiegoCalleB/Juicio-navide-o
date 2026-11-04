import Link from 'next/link';
import type { ReactNode } from 'react';

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-serif text-xl text-[#f6d77a]">{title}</h2>
      <div className="space-y-2 text-[15px] leading-relaxed text-[#fff6dc]/80">{children}</div>
    </section>
  );
}

export function ContactLine() {
  return CONTACT ? (
    <p>Escríbenos a <a className="text-[#f6d77a] underline underline-offset-2" href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
  ) : (
    <p>Indica aquí el correo de contacto del responsable (configura <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_CONTACT_EMAIL</code>).</p>
  );
}

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#120822] text-[#fff6dc]">
      <div aria-hidden className="royal-sky pointer-events-none fixed inset-0" />
      <article className="relative mx-auto w-full max-w-md space-y-6 px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10">
        <header>
          <p className="text-[11px] font-bold uppercase tracking-[.25em] text-[#f6d77a]">Mensajería mágica de Navidad</p>
          <h1 className="mt-2 font-serif text-[32px] leading-tight">{title}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#fff6dc]/70">{intro}</p>
        </header>
        {children}
        <p className="text-sm text-[#fff6dc]/45">
          Texto informativo. Antes de lanzar públicamente, revísalo con un profesional y completa los datos del responsable.
        </p>
        <Link href="/" className="inline-flex min-h-12 items-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] px-6 font-bold text-[#2a0f4a] active:scale-[0.98]">
          Volver al inicio
        </Link>
      </article>
    </div>
  );
}
