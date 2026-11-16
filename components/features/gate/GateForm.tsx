'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Challenge } from '@/lib/adultGate';

/**
 * Puerta de la zona de mayores: una cuenta de cabeza con poco tiempo. Texto sobrio a propósito
 * (sin «secreto», sin «truco»): a un peque le aburre y la cierra.
 */
export function GateForm({ initial, next }: { initial: Challenge; next: string }) {
  const [ch, setCh] = useState(initial);
  const [answer, setAnswer] = useState('');
  const [left, setLeft] = useState(initial.seconds);
  const [msg, setMsg] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback((c: Challenge, note?: string) => {
    setCh(c);
    setLeft(c.seconds);
    setAnswer('');
    setMsg(note ?? null);
    input.current?.focus();
  }, []);

  useEffect(() => {
    if (locked) return;
    if (left <= 0.05) {
      fetch('/api/mayores/pregunta', { cache: 'no-store' })
        .then((r) => r.json() as Promise<{ data: Challenge }>)
        .then((j) => load(j.data, 'Se ha acabado el tiempo. Aquí tienes otra.'))
        .catch(() => setMsg('No se ha podido cargar otra. Recarga la página.'));
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 0.1), 100);
    return () => clearTimeout(t);
  }, [left, locked, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || busy || locked) return;
    setBusy(true);
    try {
      const r = await fetch('/api/mayores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: ch.token, answer, next }) });
      const j = (await r.json()) as { ok: boolean; data?: Challenge & { next?: string }; error?: { code: string; message: string } };
      if (j.ok && j.data?.next) {
        window.location.replace(j.data.next);
        return;
      }
      if (j.error?.code === 'LOCKED') {
        setLocked(true);
        setMsg(j.error.message);
      } else if (j.data?.token) {
        load(j.data, j.error?.message);
      } else {
        setMsg(j.error?.message ?? 'No se ha podido comprobar.');
      }
    } catch {
      setMsg('No se ha podido comprobar. Revisa la conexión.');
    } finally {
      setBusy(false);
    }
  };

  const pct = Math.max(0, Math.min(100, (left / ch.seconds) * 100));
  return (
    <form onSubmit={submit} className="w-full max-w-xs space-y-5 text-center" aria-label="Zona de mayores">
      <div>
        <h1 className="text-[26px] font-bold text-[#f3ecff]">Zona de mayores</h1>
        <p className="mt-1.5 text-[14.5px] text-[#f3ecff]/65">Para entrar, resuelve esta cuenta.</p>
      </div>
      {!locked && (
        <>
          <p className="font-mono text-[44px] font-bold tabular-nums tracking-wide text-[#f3ecff]" aria-live="polite" data-testid="gate-question">
            {ch.question} = ?
          </p>
          <div aria-hidden className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#f6d77a] transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
          </div>
          <label htmlFor="gate-answer" className="sr-only">Resultado</label>
          <input
            ref={input}
            id="gate-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.replace(/[^\d-]/g, '').slice(0, 5))}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            autoFocus
            className="min-h-14 w-full rounded-2xl border border-white/20 bg-[#16112a] px-4 text-center text-2xl tabular-nums text-[#f3ecff] focus:border-[#f6d77a] focus:outline-none"
          />
          <button type="submit" disabled={!answer || busy} className="min-h-12 w-full rounded-2xl bg-[#f6d77a] font-bold text-[#24123f] disabled:opacity-40 active:scale-[0.98]">
            {busy ? 'Comprobando…' : 'Entrar'}
          </button>
        </>
      )}
      {msg && <p role="alert" className="text-[14px] text-[#ffb4b5]">{msg}</p>}
      <p className="pt-2 text-[13px]"><a href="/" className="text-[#f3ecff]/55 underline underline-offset-2">Volver</a></p>
    </form>
  );
}
