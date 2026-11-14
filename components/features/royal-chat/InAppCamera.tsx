'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  onShot: (file: File) => void;
  onClose: () => void;
  /** Abrir la cámara del sistema (plan B si el navegador no deja usar la cámara aquí). */
  onSystemCamera: () => void;
}

const MAX_SIDE = 1920;

/**
 * Cámara dentro de la propia web. En Android, abrir la app de cámara del sistema puede hacer que
 * Chrome se cierre por falta de memoria y la foto se pierda; aquí la página nunca sale de primer plano.
 */
export function InAppCamera({ onShot, onClose, onSystemCamera }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    stop();
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-camera');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => undefined);
        }
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [facing, stop]);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const shoot = async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth || busy) return;
    setBusy(true);
    try {
      const scale = Math.min(1, MAX_SIDE / Math.max(v.videoWidth, v.videoHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(v.videoWidth * scale);
      canvas.height = Math.round(v.videoHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      if (facing === 'user') {
        // La cámara frontal se ve como un espejo: la foto sale igual que en pantalla.
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
      if (!blob) throw new Error('blob');
      stop();
      onShot(new File([blob], 'foto.jpg', { type: 'image/jpeg' }));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Cámara" className="fixed inset-0 z-[60] flex flex-col bg-black text-white">
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          data-testid="in-app-camera"
          className={`absolute inset-0 size-full object-contain ${facing === 'user' ? '-scale-x-100' : ''}`}
        />
        {!ready && !failed && <p className="absolute inset-0 grid place-items-center text-[15px] opacity-70">Abriendo la cámara…</p>}
        {failed && (
          <div className="absolute inset-0 grid place-items-center p-6">
            <div className="max-w-xs space-y-3 text-center">
              <p className="text-[15px] leading-snug">No se ha podido abrir la cámara aquí. Revisa el permiso de cámara del navegador o usa la cámara del móvil.</p>
              <button type="button" onClick={onSystemCamera} className="min-h-12 w-full rounded-2xl bg-white font-bold text-black active:scale-[0.98]">
                Usar la cámara del móvil
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <button type="button" onClick={onClose} className="min-h-12 min-w-20 rounded-xl px-3 text-[15px] font-semibold active:bg-white/10">
          Cancelar
        </button>
        <button
          type="button"
          aria-label="Hacer la foto"
          onClick={shoot}
          disabled={!ready || busy}
          className="size-[4.5rem] rounded-full border-4 border-white bg-white/90 shadow-lg transition-transform active:scale-90 disabled:opacity-40"
        />
        <button
          type="button"
          aria-label="Cambiar de cámara"
          onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
          disabled={failed}
          className="min-h-12 min-w-20 rounded-xl px-3 text-[24px] active:bg-white/10 disabled:opacity-30"
        >
          🔄
        </button>
      </div>
    </div>
  );
}
