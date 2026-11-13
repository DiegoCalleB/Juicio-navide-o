'use client';

import { useState } from 'react';
import { R } from '@/components/LocaleProvider';
import { setLockedDevice } from '@/lib/myLock';

type Mode = 'idle' | 'set' | 'remove';

/**
 * Bloqueo parental: poner, cambiar o quitar el PIN de los padres, y bloquear ya.
 * Al poner el PIN se enseña UNA vez el código de rescate (por si se olvida el PIN: no hay cuentas ni correo).
 */
export function PinSettings({ token, hasPin, intro, tone = 'panel', onDone }: { token: string; hasPin: boolean; intro?: string; tone?: 'panel' | 'landing'; onDone?: () => void }) {
  const [mode, setMode] = useState<Mode>('idle');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const call = async (body: Record<string, string>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${token}/pin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = (await res.json()) as { ok: boolean; data?: { recovery: string | null }; error?: { message: string } };
      if (!json.ok) throw new Error(json.error?.message ?? 'No se pudo guardar.');
      return json.data ?? { recovery: null };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const activate = async () => {
    const out = await call({ action: 'set', pin });
    if (out) {
      setLockedDevice(true);
      setRecovery(out.recovery);
      setPin('');
    }
  };
  const remove = async () => {
    if (await call({ action: 'remove', pin })) {
      setLockedDevice(false);
      window.location.reload();
    }
  };
  const lockNow = async () => {
    if (await call({ action: 'lock' })) window.location.reload();
  };

  const accent = tone === 'panel' ? 'text-[#5eead4]' : 'text-[#f6d77a]';
  const box = tone === 'panel' ? 'border-[#5eead4]/30 bg-[#5eead4]/[.06] text-[#e8f1ff]' : 'border-[#f6d77a]/40 bg-[#f6d77a]/[.07] text-[#fff6dc]';
  const btn = tone === 'panel' ? 'bg-[#5eead4] text-[#04302b]' : 'bg-[#f6d77a] text-[#2a0f4a]';
  const input = 'min-h-12 w-full rounded-xl border border-white/20 bg-black/30 px-3 text-center text-xl tracking-[.4em] focus:outline-none';

  if (recovery) {
    return (
      <section aria-label="Código de rescate" className="rounded-2xl border-2 border-[#f6d77a] bg-[#f6d77a]/[.09] p-4 text-[13.5px] leading-snug text-[#fff6dc]">
        <p className="text-[15px] font-extrabold text-[#f6d77a]">🔑 Guarda tu código de rescate</p>
        <p className="mt-1 opacity-85">Si algún día olvidas el PIN, es la única forma de entrar. <strong>Solo se enseña ahora.</strong> Mándatelo o apúntalo en un sitio seguro (no con tu peque).</p>
        <p className="mt-3 rounded-xl bg-black/35 py-3 text-center font-mono text-[22px] font-bold tracking-widest" data-recovery={recovery}>{recovery}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(recovery);
                setCopied(true);
              } catch {
                /* sin permisos */
              }
            }}
            className="min-h-10 flex-1 rounded-xl bg-white/10 font-semibold"
          >
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(`Mi código de rescate de Línea Mágica: ${recovery}`)}`} target="_blank" rel="noopener noreferrer" className="grid min-h-10 flex-1 place-items-center rounded-xl bg-[#25d366] font-bold text-[#062b14]">
            Mandármelo
          </a>
        </div>
        <button type="button" onClick={() => (onDone ? onDone() : window.location.reload())} className="mt-3 min-h-11 w-full rounded-xl bg-[#f6d77a] font-bold text-[#2a0f4a]">
          Ya lo he guardado
        </button>
      </section>
    );
  }

  return (
    <section aria-label="Bloqueo de los padres" className={`rounded-2xl border p-3.5 text-[13.5px] leading-snug ${box}`}>
      {hasPin ? (
        <>
          <p className={`font-bold ${accent}`}>🔒 Bloqueo activado</p>
          <p className="mt-1 opacity-75"><R>Tu peque no puede ver este panel aunque coja tu móvil. Se vuelve a pedir el PIN a los 30 minutos o al salir de la app un minuto.</R></p>
          {mode === 'idle' && (
            <div className="mt-2.5 grid grid-cols-3 gap-2 text-[13px]">
              <button type="button" onClick={lockNow} disabled={busy} className={`min-h-10 rounded-xl font-bold ${btn}`}>Bloquear ya</button>
              <button type="button" onClick={() => { setMode('set'); setError(null); }} className="min-h-10 rounded-xl bg-white/10 font-semibold">Cambiar PIN</button>
              <button type="button" onClick={() => { setMode('remove'); setError(null); }} className="min-h-10 rounded-xl bg-white/10 font-semibold">Quitar</button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className={`font-bold ${accent}`}>🔒 Protege el panel con un PIN</p>
          <p className="mt-1 opacity-75"><R>{intro ?? 'Si tu peque coge tu móvil, no podrá ver lo que escribes como el personaje. El PIN lo compruebas solo tú.'}</R></p>
          {mode === 'idle' && (
            <button type="button" onClick={() => { setMode('set'); setError(null); }} className={`mt-2.5 min-h-10 rounded-xl px-4 font-bold ${btn}`}>Poner un PIN</button>
          )}
        </>
      )}

      {mode !== 'idle' && (
        <div className="mt-2.5 space-y-2">
          <label htmlFor={`pin-${token.slice(0, 6)}`} className="block text-[12.5px] opacity-80">
            {mode === 'remove' ? 'Escribe tu PIN actual para quitarlo' : hasPin ? 'Escribe el PIN nuevo (4 a 6 cifras)' : 'Elige un PIN de 4 a 6 cifras'}
          </label>
          <input
            id={`pin-${token.slice(0, 6)}`}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            aria-label={mode === 'remove' ? 'PIN actual' : 'PIN nuevo'}
            className={input}
          />
          <div className="flex gap-2">
            <button type="button" onClick={mode === 'remove' ? remove : activate} disabled={busy || pin.length < 4} className={`min-h-10 flex-1 rounded-xl font-bold disabled:opacity-40 ${btn}`}>
              {busy ? 'Un momento…' : mode === 'remove' ? 'Quitar el PIN' : 'Activar el bloqueo'}
            </button>
            <button type="button" onClick={() => { setMode('idle'); setPin(''); setError(null); }} className="min-h-10 rounded-xl border border-white/25 px-4 font-semibold">Cancelar</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-[#ff8a8c]">{error}</p>}
    </section>
  );
}
