'use client';

import { useState } from 'react';
import type { ApiResult } from './mapping';

const NAME_MARK = '[nombre]';

/**
 * «✨ Ayúdame a escribirlo»: los padres cuentan la idea y se proponen 3 mensajes con la voz del personaje.
 * El nombre del niño no sale del navegador: llega «[nombre]» y se sustituye aquí.
 */
export function AssistantBox({ token, childName, characterShort, onPick }: { token: string; childName: string; characterShort: string; onPick: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [idea, setIdea] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<string[]>([]);

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim().length < 3 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${token}/suggest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idea: idea.trim() }) });
      const j = (await res.json().catch(() => null)) as ApiResult<{ suggestions: string[] }> | null;
      if (!j?.ok || !j.data) throw new Error(j?.error?.message ?? 'No he podido proponer mensajes ahora.');
      setList(j.data.suggestions.map((s) => s.split(NAME_MARK).join(childName)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No he podido proponer mensajes ahora.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start rounded-full border border-[#f6d77a]/60 px-3 py-1 text-[12.5px] font-bold text-[#f6d77a] active:bg-white/5">
        ✨ Ayúdame a escribirlo
      </button>
    );
  }

  return (
    <section aria-label="Ayudante para escribir" className="space-y-2 rounded-2xl border border-[#f6d77a]/35 bg-[#f6d77a]/[.06] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12.5px] font-bold text-[#f6d77a]">✨ Cuéntame la idea y te propongo el mensaje de {characterShort}</p>
        <button type="button" onClick={() => setOpen(false)} className="shrink-0 text-[12px] text-[#e8f1ff]/60 underline underline-offset-2">Cerrar</button>
      </div>
      <form onSubmit={ask} className="flex gap-2">
        <label htmlFor="assistant-idea" className="sr-only">Idea para el mensaje</label>
        <input
          id="assistant-idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          maxLength={300}
          placeholder="Ej.: hoy ha recogido sus juguetes sin protestar"
          className="min-h-11 flex-1 rounded-xl border border-white/15 bg-[#0a1220] px-3 text-[14px] text-[#e8f1ff] placeholder:text-[#e8f1ff]/35 focus:border-[#f6d77a] focus:outline-none"
        />
        <button type="submit" disabled={busy || idea.trim().length < 3} className="shrink-0 rounded-xl bg-[#f6d77a] px-3 text-[13px] font-bold text-[#2a0f4a] disabled:opacity-50">
          {busy ? 'Pensando…' : 'Proponer'}
        </button>
      </form>
      {error && <p role="alert" className="text-[12.5px] text-[#ff8a8c]">{error}</p>}
      {list.length > 0 && (
        <ul className="space-y-1.5" aria-label="Propuestas">
          {list.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => {
                  onPick(s);
                  setOpen(false);
                  setList([]);
                  setIdea('');
                }}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-left text-[13.5px] leading-snug text-[#e8f1ff] active:bg-white/10"
              >
                {s}
              </button>
            </li>
          ))}
          <li className="text-[11.5px] text-[#e8f1ff]/50">Toca una para ponerla en el mensaje y revísala antes de enviar. Propuestas creadas con IA.</li>
        </ul>
      )}
    </section>
  );
}
