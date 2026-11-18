'use client';

import { useState } from 'react';

export function BajaForm({ e, s }: { e: string; s: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const go = async () => {
    setState('busy');
    try {
      const res = await fetch('/api/baja', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ e, s }) });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };
  if (state === 'done') return <p>Listo: hemos borrado tu correo y no volverás a recibir nada.</p>;
  return (
    <>
      <p className="opacity-80">Si te das de baja, borramos tu correo y dejas de recibir novedades.</p>
      <button type="button" onClick={go} disabled={state === 'busy'} className="min-h-12 rounded-xl bg-[#5eead4] px-6 font-bold text-[#04302b] disabled:opacity-50">
        {state === 'busy' ? 'Un momento…' : 'Darme de baja'}
      </button>
      {state === 'error' && <p role="alert" className="text-[#ff8a8c]">No se ha podido completar. Inténtalo de nuevo.</p>}
    </>
  );
}
