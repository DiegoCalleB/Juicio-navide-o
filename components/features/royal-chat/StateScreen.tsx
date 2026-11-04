import Link from 'next/link';
import type { ReactNode } from 'react';

/** Pantalla a sangre con el estilo de la app, para estados vacíos, de error y de carga. */
export function StateScreen({ title, children, action }: { title: string; children?: ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#120822] px-6 text-center">
      <div aria-hidden className="royal-sky pointer-events-none absolute inset-0" />
      <div className="relative max-w-sm">
        <div aria-hidden className="mx-auto mb-5 grid size-16 place-items-center rounded-full border border-[#f6d77a]/40 bg-[#f6d77a]/10 text-3xl">✨</div>
        <h1 className="font-serif text-[28px] leading-tight text-[#fff6dc]">{title}</h1>
        {children && <div className="mt-3 text-[15px] leading-relaxed text-[#fff6dc]/70">{children}</div>}
        {action && (
          <Link href={action.href} className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] px-6 font-bold text-[#2a0f4a] active:scale-[0.98]">
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[#120822]" role="status" aria-live="polite">
      <div aria-hidden className="royal-sky pointer-events-none absolute inset-0" />
      <div className="relative text-center">
        <div aria-hidden className="mx-auto size-10 animate-spin rounded-full border-4 border-[#f6d77a]/25 border-t-[#f6d77a]" />
        <p className="mt-4 text-[14px] text-[#fff6dc]/60">{label}</p>
      </div>
    </div>
  );
}
