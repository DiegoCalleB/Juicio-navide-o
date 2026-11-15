'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { compressForChat } from '@/lib/image';
import type { ApiResult } from './mapping';

/**
 * «✨ Convertir en escena mágica»: crea la ilustración a partir del dibujo del niño y la enseña
 * a los padres. Solo se envía si la aprueban.
 */
export function MagicSceneDialog({ token, src, childName, characterShort, onClose, onSent }: { token: string; src: string; childName: string; characterShort: string; onClose: () => void; onSent: () => void }) {
  const [phase, setPhase] = useState<'working' | 'ready' | 'sending' | 'error'>('working');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const started = useRef(false);

  const create = useCallback(async () => {
    setPhase('working');
    setError(null);
    try {
      const original = await (await fetch(src)).blob();
      const form = new FormData();
      form.append('image', original, 'dibujo');
      const res = await fetch(`/api/rooms/${token}/magic`, { method: 'POST', body: form });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as ApiResult<null> | null;
        throw new Error(j?.error?.message ?? 'No he podido crear la escena.');
      }
      const l = Number(res.headers.get('X-Magic-Left'));
      setLeft(Number.isFinite(l) ? l : null);
      const blob = await res.blob();
      setResult((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { blob, url: URL.createObjectURL(blob) };
      });
      setPhase('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No he podido crear la escena.');
      setPhase('error');
    }
  }, [src, token]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void create();
  }, [create]);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  const send = async () => {
    if (!result) return;
    setPhase('sending');
    try {
      const file = new File([result.blob], 'escena.jpg', { type: result.blob.type || 'image/jpeg' });
      const blob = await compressForChat(file);
      const form = new FormData();
      form.append('image', blob, 'escena');
      form.append('caption', `¡Mira lo que ha pasado con tu dibujo, ${childName}! ✨`);
      form.append('delayMinutes', '0');
      const res = await fetch(`/api/rooms/${token}/photo`, { method: 'POST', body: form });
      const j = (await res.json().catch(() => null)) as ApiResult<null> | null;
      if (!j?.ok) throw new Error(j?.error?.message ?? 'No se pudo enviar.');
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar.');
      setPhase('ready');
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Escena mágica" className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4">
      <div className="w-full max-w-md space-y-3 rounded-3xl border border-[#f6d77a]/40 bg-[#0f1830] p-4 text-[#e8f1ff]">
        <p className="text-[15px] font-bold text-[#f6d77a]">✨ Escena mágica con {characterShort}</p>
        {phase === 'working' && (
          <div className="grid place-items-center gap-3 py-8 text-center" role="status">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="Dibujo original" className="max-h-40 rounded-xl opacity-70" />
            <p className="text-[14px]">Creando la magia… suele tardar unos 20 segundos.</p>
          </div>
        )}
        {result && phase !== 'working' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={result.url} alt="Escena mágica creada a partir del dibujo" className="w-full rounded-2xl" />
        )}
        {error && <p role="alert" className="text-[13.5px] leading-snug text-[#ff8a8c]">{error}</p>}
        {phase !== 'working' && (
          <div className="space-y-2">
            {result && (
              <button type="button" onClick={send} disabled={phase === 'sending'} className="min-h-12 w-full rounded-2xl bg-gradient-to-b from-[#5eead4] to-[#14b8a6] font-bold text-[#04302b] disabled:opacity-50">
                {phase === 'sending' ? 'Enviando…' : `Enviar a ${childName}`}
              </button>
            )}
            <div className="flex gap-2">
              {(left === null || left > 0) && (
                <button type="button" onClick={create} disabled={phase === 'sending'} className="min-h-11 flex-1 rounded-xl border border-white/20 text-[13.5px] font-semibold">
                  {result ? 'Crear otra' : 'Reintentar'}
                </button>
              )}
              <button type="button" onClick={onClose} disabled={phase === 'sending'} className="min-h-11 flex-1 rounded-xl border border-white/20 text-[13.5px] font-semibold">
                Cancelar
              </button>
            </div>
            <p className="text-[11.5px] leading-snug text-[#e8f1ff]/50">
              Ilustración creada con IA a partir de su dibujo. Solo se envía si tú lo decides. {left !== null && `Hoy te quedan ${left}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
