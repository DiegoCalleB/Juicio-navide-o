'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadPass, startCheckout } from '@/lib/myPass';
import type { BillingInfo } from './PassOffer';

/**
 * "Elige cómo empezar": la prueba gratis y el Pase de Navidad, uno al lado del otro, explicados.
 * Quien prefiere comprar antes de crear nada (o regalarlo) puede hacerlo desde aquí.
 * Solo se muestra si los cobros están activos y este móvil aún no tiene un pase.
 */
export function PricingSection({ billing }: { billing: BillingInfo }) {
  const [hasPass, setHasPass] = useState(false);
  const [waiver, setWaiver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setHasPass(!!loadPass()), []);

  if (!billing.enabled || hasPass) return null;

  const buy = async () => {
    if (!waiver) return setError('Marca la casilla para continuar.');
    setBusy(true);
    setError(null);
    const err = await startCheckout();
    if (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <section id="pase" aria-labelledby="pase-title" className="mb-8 scroll-mt-4">
      <h2 id="pase-title" className="mb-3 text-center font-serif text-2xl text-[#fff6dc]">Elige cómo empezar</h2>
      <div className="space-y-3">
        <article className="rounded-3xl border border-white/10 bg-[#1d0b3a]/70 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[16px] font-bold text-[#fff6dc]">Prueba gratis</h3>
            <p className="text-[13px] font-semibold text-[#7ee2a8]">0 €</p>
          </div>
          <ul className="mt-2 space-y-1 text-[13.5px] leading-snug text-[#fff6dc]/75">
            <li>✓ 3 días para probarlo con vuestros peques</li>
            <li>✓ Una sala por cada peque (hasta 5)</li>
            <li>✓ Mensajes y fotos, sin registrarte</li>
          </ul>
          <a href="#crear" className="mt-3 grid min-h-11 place-items-center rounded-xl border border-white/20 font-semibold text-[#fff6dc] active:scale-[0.98]">
            Empezar gratis
          </a>
        </article>

        <article className="relative rounded-3xl border-2 border-[#f6d77a] bg-gradient-to-b from-[#f6d77a]/[.13] to-[#f6d77a]/[.04] p-4 shadow-lg">
          <p className="absolute -top-3 left-4 rounded-full bg-[#f6d77a] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#2a0f4a]">Recomendado</p>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[17px] font-bold text-[#f6d77a]">Pase de Navidad</h3>
            <p className="text-[18px] font-extrabold text-[#fff6dc]">{billing.price}</p>
          </div>
          <p className="text-right text-[11.5px] text-[#fff6dc]/55">Pago único, sin suscripción{billing.launchNote ? ` · lanzamiento ${billing.launchNote}` : ''}</p>
          <ul className="mt-2 space-y-1 text-[13.5px] leading-snug text-[#fff6dc]/85">
            <li>✓ La magia sigue hasta el 20 de enero</li>
            <li>✓ Todos los peques y todos los personajes (hasta 10 salas)</li>
            <li>✓ 🎁 Incluye un pase para regalar a otra familia</li>
            <li>✓ Se activa al momento, sin esperas</li>
          </ul>
          <label className="mt-3 flex items-start gap-2.5 text-[11.5px] leading-snug text-[#fff6dc]/70">
            <input type="checkbox" checked={waiver} onChange={(e) => setWaiver(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#f6d77a]" />
            <span>
              Quiero que el pase se active ya y entiendo que, al ser contenido digital, pierdo el derecho de desistimiento.{' '}
              <Link href="/terminos#pase" target="_blank" className="underline underline-offset-2">Condiciones</Link>
            </span>
          </label>
          <button type="button" onClick={buy} disabled={busy} className="mt-3 min-h-12 w-full rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a] shadow disabled:opacity-60 active:scale-[0.99]">
            {busy ? 'Abriendo el pago…' : `Conseguir el Pase · ${billing.price}`}
          </button>
          {error && <p role="alert" className="mt-2 text-[13px] text-[#ff8a8c]">{error}</p>}
          <p className="mt-2 text-center text-[11.5px] text-[#fff6dc]/50">Pago seguro con Stripe · también para regalar a abuelos y tíos</p>
        </article>
      </div>
    </section>
  );
}
