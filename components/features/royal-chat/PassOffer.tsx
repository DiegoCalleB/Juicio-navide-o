'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { forgetPass, loadPass, startCheckout } from '@/lib/myPass';
import { R } from '@/components/LocaleProvider';

export interface BillingInfo {
  enabled: boolean;
  /** "3,99 €" */
  price: string;
  /** Precio de lanzamiento activo: "hasta el 1 de diciembre". */
  launchNote: string | null;
  /** Campaña activa (p. ej. Black Friday): etiqueta y último día, ya escrito ("lunes 30 de noviembre"). */
  campaign: { label: string; until: string } | null;
}

/**
 * Oferta del Pase de Navidad (solo para los padres). Sencilla: qué incluye, una casilla legal y un botón.
 * Si en este móvil ya hay un pase, ofrece usarlo con un toque.
 */
export function PassOffer({
  billing,
  roomToken,
  title,
  childName,
  tone = 'panel',
  onUnlocked,
}: {
  billing: BillingInfo;
  roomToken?: string;
  title: string;
  childName?: string;
  tone?: 'panel' | 'landing';
  onUnlocked?: () => void;
}) {
  const [waiver, setWaiver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPass, setSavedPass] = useState<string | null>(null);
  useEffect(() => setSavedPass(loadPass()), []);

  const accent = tone === 'panel' ? 'text-[#5eead4]' : 'text-[#f6d77a]';
  const btn = tone === 'panel' ? 'bg-[#5eead4] text-[#04302b]' : 'bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] text-[#2a0f4a]';
  const text = tone === 'panel' ? 'text-[#e8f1ff]' : 'text-[#fff6dc]';

  const buy = async () => {
    if (!waiver) return setError('Marca la casilla para continuar.');
    setBusy(true);
    setError(null);
    const err = await startCheckout(roomToken);
    if (err) {
      setError(err);
      setBusy(false);
    }
  };

  const useSaved = async () => {
    if (!savedPass || !roomToken) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomToken}/pass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passToken: savedPass }),
      });
      const json = (await res.json()) as { ok: boolean; error?: { code: string; message: string } };
      if (!json.ok) {
        if (json.error?.code === 'PASS_EXPIRED' || json.error?.code === 'PASS_NOT_FOUND') {
          forgetPass();
          setSavedPass(null);
        }
        throw new Error(json.error?.message ?? 'No se pudo usar el pase.');
      }
      onUnlocked?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo usar el pase.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Pase de Navidad" className={`space-y-3 rounded-2xl border border-white/15 bg-white/[.05] p-4 text-[13px] leading-relaxed ${text}`}>
      <p className={`text-[15px] font-bold ${accent}`}>{title}</p>
      {savedPass && roomToken ? (
        <>
          <p className="opacity-80"><R>En este móvil ya tienes un Pase de Navidad.</R></p>
          <button type="button" onClick={useSaved} disabled={busy} className={`min-h-12 w-full rounded-2xl font-bold disabled:opacity-60 ${btn}`}>
            {busy ? 'Activando…' : 'Usar mi pase en esta sala'}
          </button>
        </>
      ) : (
        <>
          <ul className="space-y-1 opacity-85">
            <li><R>✓ {childName ? `${childName} sigue` : 'Seguís'} escribiéndose hasta el 20 de enero</R></li>
            <li>✓ Papá Noel, el elfo y los Reyes, para todos los hermanos</li>
            <li>✓ Un pase de regalo para otra familia</li>
            <li>✓ Pago único, sin suscripción</li>
          </ul>
          <label className="flex items-start gap-2.5 text-[12px] leading-snug opacity-80">
            <input type="checkbox" checked={waiver} onChange={(e) => setWaiver(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-current" />
            <span>
              Quiero que el pase se active ya y entiendo que, al ser contenido digital, pierdo el derecho de desistimiento.{' '}
              <Link href="/terminos#pase" target="_blank" className="underline underline-offset-2">Condiciones</Link>
            </span>
          </label>
          <button type="button" onClick={buy} disabled={busy} className={`min-h-12 w-full rounded-2xl font-bold disabled:opacity-60 ${btn}`}>
            {busy ? 'Abriendo el pago…' : `Conseguir el Pase · ${billing.price}`}
          </button>
          {billing.campaign ? (
            <p className="text-center text-[11.5px] font-semibold text-[#f6d77a]">🖤 {billing.campaign.label} · hasta el {billing.campaign.until}</p>
          ) : (
            billing.launchNote && <p className="text-center text-[11px] opacity-60">Precio de lanzamiento {billing.launchNote}</p>
          )}
        </>
      )}
      {error && <p role="alert" className="text-[#ff8a8c]">{error}</p>}
    </section>
  );
}
