'use client';

import { useEffect, useState } from 'react';

/**
 * «Guárdame el enlace en mi correo»: el correo es opcional y solo sirve para no perder el acceso.
 * Las novedades son un consentimiento aparte, con la casilla SIN marcar.
 */
export function EmailLink({ token }: { token: string }) {
  const [enabled, setEnabled] = useState(false);
  const [email, setEmail] = useState('');
  const [marketing, setMarketing] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/contacto')
      .then((r) => r.json())
      .then((j: { data?: { enabled?: boolean } }) => alive && setEnabled(!!j.data?.enabled))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!enabled) return null;

  const send = async () => {
    setState('busy');
    setError(null);
    try {
      const res = await fetch('/api/contacto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email, marketing }) });
      const j = (await res.json()) as { ok: boolean; error?: { message: string } };
      if (!j.ok) throw new Error(j.error?.message ?? 'No se ha podido enviar.');
      setState('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido enviar.');
      setState('idle');
    }
  };

  const id = `mail-${token.slice(0, 6)}`;
  return (
    <section aria-label="Enlace por correo" className="rounded-2xl border border-white/15 bg-white/[.04] p-3.5 text-[13.5px] leading-snug text-[#e8f1ff]">
      <p className="font-bold text-[#5eead4]">✉️ Recibe tu enlace por correo</p>
      {state === 'done' ? (
        <p className="mt-1 opacity-85">Enviado. Mira tu bandeja de entrada (y la carpeta de spam). Con ese correo podrás entrar desde otro móvil o compartirlo con tu pareja.</p>
      ) : (
        <>
          <p className="mt-1 opacity-75">Así no pierdes el acceso si cambias de móvil, y puedes reenviárselo a tu pareja. Es opcional.</p>
          <label htmlFor={id} className="mt-2.5 block text-[12.5px] opacity-80">Tu correo</label>
          <input id={id} type="email" inputMode="email" autoComplete="email" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-white/20 bg-black/30 px-3 focus:outline-none" />
          <label className="mt-2.5 flex items-start gap-2 text-[12.5px] opacity-85">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Quiero recibir novedades y ofertas de Línea Mágica. Puedo darme de baja cuando quiera.</span>
          </label>
          <button type="button" onClick={send} disabled={state === 'busy' || !/^\S+@\S+\.\S+$/.test(email)} className="mt-3 min-h-11 w-full rounded-xl bg-[#5eead4] font-bold text-[#04302b] disabled:opacity-40">
            {state === 'busy' ? 'Enviando…' : 'Enviármelo'}
          </button>
          {error && <p role="alert" className="mt-2 text-[#ff8a8c]">{error}</p>}
        </>
      )}
    </section>
  );
}
