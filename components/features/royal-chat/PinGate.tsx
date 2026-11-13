'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { setLockedDevice } from '@/lib/myLock';

/**
 * Pantalla de bloqueo de la zona de los padres. No lleva ningún dato de la familia (ni nombres ni mensajes):
 * el servidor no los envía hasta que se pone el PIN.
 */
export function PinGate({ token }: { token: string }) {
  const [pin, setPin] = useState('');
  const [code, setCode] = useState('');
  const [recover, setRecover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setLockedDevice(true), []);

  const call = async (url: string, body: Record<string, string>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = (await res.json()) as { ok: boolean; error?: { message: string } };
      if (!json.ok) throw new Error(json.error?.message ?? 'No se pudo comprobar.');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo comprobar.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recover) {
      if (await call(`/api/rooms/${token}/pin`, { action: 'recover', code })) {
        setLockedDevice(false);
        window.location.reload();
      }
    } else if (await call('/api/unlock', { token, pin })) {
      window.location.reload();
    }
  };

  return (
    <main className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#0a1220] px-5 text-[#e8f1ff]">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4 py-8 text-center">
        <p aria-hidden className="text-5xl">🔒</p>
        <h1 className="text-2xl font-bold">Zona de los padres</h1>
        <p className="text-[14px] leading-snug opacity-70">Esta pantalla es solo para mayores. {recover ? 'Escribe tu código de rescate.' : 'Introduce tu PIN para entrar.'}</p>

        {recover ? (
          <div>
            <label htmlFor="rescue" className="sr-only">Código de rescate</label>
            <input
              id="rescue"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={16}
              placeholder="XXXX-XXXX-XXXX"
              className="min-h-14 w-full rounded-2xl border border-white/20 bg-[#121d33] px-4 text-center font-mono text-lg tracking-widest focus:border-[#5eead4] focus:outline-none"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="pin" className="sr-only">PIN de los padres</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              autoFocus
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="min-h-14 w-full rounded-2xl border border-white/20 bg-[#121d33] px-4 text-center text-2xl tracking-[.5em] focus:border-[#5eead4] focus:outline-none"
            />
          </div>
        )}

        {error && <p role="alert" className="text-[13.5px] text-[#ff8a8c]">{error}</p>}

        <button type="submit" disabled={busy || (recover ? code.length < 12 : pin.length < 4)} className="min-h-12 w-full rounded-2xl bg-[#5eead4] font-bold text-[#04302b] disabled:opacity-40 active:scale-[0.98]">
          {busy ? 'Comprobando…' : recover ? 'Recuperar acceso' : 'Entrar'}
        </button>

        <div className="space-y-2 pt-1 text-[13px]">
          <button type="button" onClick={() => { setRecover((v) => !v); setError(null); }} className="underline underline-offset-2 opacity-70">
            {recover ? 'Volver al PIN' : '¿Has olvidado el PIN?'}
          </button>
          <div>
            <Link href="/" className="opacity-60 underline underline-offset-2">Ir al inicio</Link>
          </div>
        </div>
      </form>
    </main>
  );
}
