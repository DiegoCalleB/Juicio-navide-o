'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Chispa pregunta la edad en la portada (REGLA DE ORO, AGENTS.md). Un peque no le miente al elfo: si dice ser
 * menor, Chispa le ofrece un chiste y los enlaces para los mayores no aparecen nunca en ese dispositivo.
 * Si dice ser mayor, la portada vuelve a pintarse con esos enlaces discretos (no se le lleva a ninguna parte).
 */
export function ChispaEdadTarjeta() {
  const router = useRouter();
  const [age, setAge] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [minor, setMinor] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age.trim() || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch('/api/mayores/edad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ age }) });
      const j = (await r.json()) as { ok: boolean; data?: { adult: boolean }; error?: { message: string } };
      if (j.ok && j.data?.adult) router.refresh();
      else if (j.ok) setMinor(true);
      else setMsg(j.error?.message ?? 'Prueba otra vez.');
    } catch {
      setMsg('Prueba otra vez.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Chispa pregunta" className="mt-4 flex items-center gap-3 rounded-2xl border border-[#f6d77a]/25 bg-white/[.04] p-3 text-left lg:max-w-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/elfo/chispa.jpg" width={56} height={56} alt="Chispa, el elfo" className="size-14 shrink-0 rounded-full border border-[#f6d77a]/50 object-cover" />
      {minor ? (
        <div className="min-w-0 text-[14px] leading-snug text-[#fff6dc]/85" data-testid="chispa-tarjeta-despedida">
          ¡Qué bien! ¿Quieres que te cuente un chiste?{' '}
          <Link href="/polo-norte#chistes" className="font-bold text-[#7ee2a8] underline underline-offset-2">¡Sí!</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="min-w-0 flex-1">
          <label htmlFor="edad-portada" className="block text-[14px] font-semibold leading-snug text-[#fff6dc]">
            ¡Hola! Soy Chispa. ¿Cuántos años tienes?
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="edad-portada"
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              className="min-h-10 w-20 rounded-xl border border-white/20 bg-[#16112a] px-3 text-center text-lg tabular-nums text-[#f3ecff] focus:border-[#f6d77a] focus:outline-none"
            />
            <button type="submit" disabled={!age || busy} className="min-h-10 rounded-xl bg-[#f6d77a] px-4 text-[14px] font-bold text-[#24123f] disabled:opacity-40 active:scale-95">
              {busy ? '…' : 'Contarle'}
            </button>
          </div>
          {msg && <p role="alert" className="mt-1 text-[12.5px] text-[#ffb4b5]">{msg}</p>}
        </form>
      )}
    </section>
  );
}
