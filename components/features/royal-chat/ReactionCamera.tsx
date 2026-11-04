'use client';

import { useEffect, useRef } from 'react';
import { IconClose } from './icons';
import type { Facing, RecPhase } from './useReactionRecorder';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

interface ReactionCameraProps {
  stream: MediaStream | null;
  phase: RecPhase;
  facing: Facing;
  /** Segundos que faltan para empezar (null si ya no hay cuenta atrás). */
  countdown: number | null;
  elapsed: number;
  minimized: boolean;
  onToggleMinimize: () => void;
  onFlip: () => void;
  onStop: () => void;
  onCancel: () => void;
}

/** Vista previa de la cámara con cuenta atrás, indicador REC y modo minimizado. */
export function ReactionCamera({ stream, phase, facing, countdown, elapsed, minimized, onToggleMinimize, onFlip, onStop, onCancel }: ReactionCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = stream;
    if (stream) void v.play().catch(() => undefined);
  }, [stream, minimized]);

  const recording = phase === 'recording';
  const mirror = facing === 'user' ? '-scale-x-100' : '';

  if (minimized) {
    return (
      <div className="absolute right-3 top-[84px] z-40 w-[104px] overflow-hidden rounded-2xl border-2 border-[#e5383b] bg-black shadow-2xl">
        <div className="relative aspect-[9/16]">
          <video ref={videoRef} muted playsInline autoPlay className={`absolute inset-0 size-full object-cover ${mirror}`} />
          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
            <span className="size-1.5 animate-pulse rounded-full bg-[#e5383b]" /> {fmt(elapsed)}
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-white/15 bg-black/80 text-[11px] font-bold text-white">
          <button type="button" onClick={onToggleMinimize} className="py-2">Ampliar</button>
          <button type="button" onClick={onStop} className="py-2 text-[#ff8a8c]">Parar</button>
        </div>
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Cámara para grabar la reacción" className="absolute inset-0 z-40 bg-black">
      <video ref={videoRef} muted playsInline autoPlay className={`absolute inset-0 size-full object-cover ${mirror}`} />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/70" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        {recording ? (
          <span className="flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-sm font-bold text-white" role="timer" aria-label={`Grabando ${fmt(elapsed)}`}>
            <span className="size-2.5 animate-pulse rounded-full bg-[#e5383b]" /> REC {fmt(elapsed)}
          </span>
        ) : (
          <span className="rounded-full bg-black/55 px-3 py-1.5 text-sm font-semibold text-white">Apunta al niño</span>
        )}
        <div className="flex gap-2">
          {!recording && (
            <button type="button" onClick={onFlip} className="rounded-full bg-black/55 px-3 py-1.5 text-sm font-semibold text-white active:scale-95">
              Girar cámara
            </button>
          )}
          {recording && (
            <button type="button" onClick={onToggleMinimize} className="rounded-full bg-black/55 px-3 py-1.5 text-sm font-semibold text-white active:scale-95">
              Minimizar
            </button>
          )}
        </div>
      </div>

      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 grid place-items-center">
          <p aria-live="assertive" className="font-serif text-[150px] leading-none text-white drop-shadow-[0_4px_24px_rgba(0,0,0,.6)]">{countdown}</p>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
        {recording ? (
          <>
            <p className="mb-3 text-sm text-white/80">Graba la cara del niño. Pulsa parar cuando termine.</p>
            <button type="button" onClick={onStop} aria-label="Parar la grabación" className="mx-auto grid size-[72px] place-items-center rounded-full border-4 border-white active:scale-95">
              <span className="size-8 rounded-md bg-[#e5383b]" />
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-white/80">La sorpresa llega al niño cuando la cuenta llegue a cero.</p>
            <button type="button" onClick={onCancel} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-black/55 px-5 font-semibold text-white active:scale-95">
              <IconClose className="size-5" /> Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
