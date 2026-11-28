'use client';

import { useState } from 'react';

export function MetricasLogin() {
  const [token, setToken] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const r = await fetch('/api/metricas/entrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    if (r.ok) location.reload();
    else { setErr(r.status === 429 ? 'Demasiados intentos. Espera un poco.' : 'Clave incorrecta.'); setBusy(false); }
  }
  return (
    <form onSubmit={go} className="mx-auto mt-24 w-full max-w-xs space-y-3 px-4">
      <label className="block text-[14px] text-white/70" htmlFor="k">Clave</label>
      <input id="k" type="password" autoComplete="current-password" value={token} onChange={(e) => setToken(e.target.value)} className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-3 text-[16px] text-white outline-none" />
      {err && <p role="alert" className="text-[13px] text-[#ff9a9a]">{err}</p>}
      <button disabled={busy || token.length < 1} className="min-h-12 w-full rounded-xl bg-[#f6d77a] font-bold text-[#2a0f4a] disabled:opacity-50">Entrar</button>
    </form>
  );
}
