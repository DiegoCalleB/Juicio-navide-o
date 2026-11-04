'use client';

import { useState } from 'react';
import type { ReactionResult } from './useReactionRecorder';

interface ReactionReviewProps {
  result: ReactionResult;
  childName: string;
  onDiscard: () => void;
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'nino';

/** Revisión del vídeo: se guarda o comparte desde el móvil de los padres; no se sube a ningún servidor. */
export function ReactionReview({ result, childName, onDiscard }: ReactionReviewProps) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const fileName = `reaccion-${slug(childName)}-${new Date().toISOString().slice(0, 10)}.${result.ext}`;
  const file = new File([result.blob], fileName, { type: result.blob.type });
  const canShare = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

  const save = () => {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const share = async () => {
    setShareError(null);
    try {
      await navigator.share({ files: [file], title: `La reacción de ${childName}` });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setShareError('No se ha podido compartir. Prueba con “Guardar en el móvil”.');
    }
  };

  const mb = (result.blob.size / 1_048_576).toFixed(1);

  return (
    <div role="dialog" aria-modal="true" aria-label="Tu vídeo" className="absolute inset-0 z-40 flex flex-col bg-[#0d0618]">
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <h2 className="text-center font-serif text-2xl text-[#fff6dc]">¡Vídeo grabado!</h2>
        <p className="mt-1 text-center text-[13px] text-[#fff6dc]/60">{Math.round(result.seconds)} s · {mb} MB · .{result.ext}</p>
        <video src={result.url} controls playsInline preload="metadata" className="mx-auto mt-4 max-h-[52dvh] w-full rounded-2xl bg-black object-contain" />

        <p className="mt-4 rounded-xl bg-[#f6d77a]/10 p-3 text-center text-[12.5px] leading-snug text-[#f6d77a]">
          Este vídeo está solo en tu móvil: no lo hemos subido a ningún sitio. Si cierras esta pantalla sin guardarlo, se pierde.
        </p>
        {result.ext === 'webm' && (
          <p className="mt-2 text-center text-[12px] leading-snug text-[#fff6dc]/50">
            Tu navegador graba en WebM. Algunas redes no lo aceptan; si te pasa, grábalo con el modo “otro móvil”.
          </p>
        )}
        {shareError && <p role="alert" className="mt-2 text-center text-[13px] text-[#ff8a8c]">{shareError}</p>}
      </div>

      <div className="space-y-2 border-t border-white/10 bg-[#1d0b3a] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {canShare && (
          <button type="button" onClick={share} className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] font-bold text-[#2a0f4a] active:scale-[0.99]">
            Compartir
          </button>
        )}
        <button type="button" onClick={save} className={`flex min-h-12 w-full items-center justify-center rounded-2xl font-bold active:scale-[0.99] ${canShare ? 'border border-[#f6d77a]/50 text-[#f6d77a]' : 'bg-gradient-to-b from-[#f6d77a] to-[#d9a23a] text-[#2a0f4a]'}`}>
          Guardar en el móvil
        </button>
        <button
          type="button"
          onClick={() => (confirmDiscard ? onDiscard() : setConfirmDiscard(true))}
          className={`flex min-h-11 w-full items-center justify-center rounded-2xl text-[14px] font-semibold ${confirmDiscard ? 'bg-[#e5383b]/20 text-[#ff8a8c]' : 'text-[#fff6dc]/60'}`}
        >
          {confirmDiscard ? 'Pulsa otra vez para descartar el vídeo' : 'Descartar'}
        </button>
      </div>
    </div>
  );
}
