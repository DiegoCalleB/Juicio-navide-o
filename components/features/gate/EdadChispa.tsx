'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * Antes de la cuenta, Chispa pregunta la edad. Un peque no le miente al elfo; si dice ser menor, Chispa lo
 * despide con cariño y lo lleva a sus chistes. Nada de «mayores» ni «padres» (REGLA DE ORO, AGENTS.md).
 */
export function EdadChispa({ initialMinor = false }: { initialMinor?: boolean }) {
  const [age, setAge] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [minor, setMinor] = useState(initialMinor);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age.trim() || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch('/api/mayores/edad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ age }) });
      const j = (await r.json()) as { ok: boolean; data?: { adult: boolean }; error?: { message: string } };
      if (j.ok && j.data?.adult) {
        window.location.reload();
        return;
      }
      if (j.ok) setMinor(true);
      else setMsg(j.error?.message ?? 'Prueba otra vez.');
    } catch {
      setMsg('Prueba otra vez.');
    } finally {
      setBusy(false);
    }
  };

  // eslint-disable-next-line @next/next/no-img-element
  const face = <img src="/elfo/chispa.jpg" width={96} height={96} alt="Chispa, el elfo" className="mx-auto size-24 rounded-full border-2 border-[#f6d77a]/60 object-cover" />;

  if (minor) {
    return (
      <div className="w-full max-w-xs space-y-5 text-center" data-testid="chispa-despedida">
        {face}
        <h1 className="font-serif text-[26px] leading-tight text-[#fff6dc]">¡Qué bien!</h1>
        <p className="text-[16px] leading-relaxed text-[#fff6dc]/80">Aquí solo hay papeleo aburridísimo. ¿Y si mejor te cuento un chiste?</p>
        <Link href="/polo-norte#chistes" className="flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a]">
          ¡Un chiste, por favor!
        </Link>
        <p className="text-[13px]"><Link href="/" className="text-[#fff6dc]/55 underline underline-offset-2">Volver</Link></p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="w-full max-w-xs space-y-5 text-center" aria-label="Chispa pregunta">
      {face}
      <div>
        <h1 className="font-serif text-[26px] leading-tight text-[#fff6dc]">¿Cuántos años tienes?</h1>
        <p className="mt-1.5 text-[15px] text-[#fff6dc]/70">¡Hola! Soy Chispa. Me gusta saber con quién hablo.</p>
      </div>
      <label htmlFor="edad" className="sr-only">Tu edad</label>
      <input
        id="edad"
        value={age}
        onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        autoFocus
        className="min-h-14 w-full rounded-2xl border border-white/20 bg-[#16112a] px-4 text-center text-2xl tabular-nums text-[#f3ecff] focus:border-[#f6d77a] focus:outline-none"
      />
      <button type="submit" disabled={!age || busy} className="min-h-12 w-full rounded-2xl bg-[#f6d77a] font-bold text-[#24123f] disabled:opacity-40 active:scale-[0.98]">
        {busy ? '…' : 'Seguir'}
      </button>
      {msg && <p role="alert" className="text-[14px] text-[#ffb4b5]">{msg}</p>}
      <p className="pt-1 text-[13px]"><Link href="/" className="text-[#f3ecff]/55 underline underline-offset-2">Volver</Link></p>
    </form>
  );
}
