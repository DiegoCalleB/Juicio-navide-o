'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface FugitiveButtonProps {
  label: string;
  surrenderLabel: string;
  /** Huidas antes de rendirse. */
  maxEscapes?: number;
  onCaught: () => void;
}

const FLEE_RADIUS = 96;
const CANDIDATES = 14;

/**
 * Botón que huye del puntero/dedo. Posición vía transform translate3d (GPU),
 * sin re-render por movimiento: solo se actualiza estado al contar huidas.
 */
export function FugitiveButton({ label, surrenderLabel, maxEscapes = 8, onCaught }: FugitiveButtonProps) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const escapesRef = useRef(0);
  const lastFleeRef = useRef(0);
  const [escapes, setEscapes] = useState(0);
  const [ready, setReady] = useState(false);
  const surrendered = escapes >= maxEscapes;

  const place = useCallback((x: number, y: number) => {
    const btn = btnRef.current;
    if (btn) btn.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  }, []);

  const center = useCallback(() => {
    const arena = arenaRef.current;
    const btn = btnRef.current;
    if (!arena || !btn) return;
    place((arena.clientWidth - btn.offsetWidth) / 2, (arena.clientHeight - btn.offsetHeight) / 2);
  }, [place]);

  useEffect(() => {
    center();
    setReady(true);
    window.addEventListener('resize', center);
    return () => window.removeEventListener('resize', center);
  }, [center]);

  useEffect(() => {
    if (surrendered) center();
  }, [surrendered, center]);

  const flee = useCallback(
    (pointer: { x: number; y: number } | null) => {
      const arena = arenaRef.current;
      const btn = btnRef.current;
      if (!arena || !btn || escapesRef.current >= maxEscapes) return;
      const now = performance.now();
      if (now - lastFleeRef.current < 160) return;
      lastFleeRef.current = now;

      const aw = arena.clientWidth - btn.offsetWidth;
      const ah = arena.clientHeight - btn.offsetHeight;
      const rect = arena.getBoundingClientRect();
      const px = pointer ? pointer.x - rect.left : -9999;
      const py = pointer ? pointer.y - rect.top : -9999;

      let best = { x: 0, y: 0, d: -1 };
      for (let i = 0; i < CANDIDATES; i++) {
        const x = Math.random() * Math.max(aw, 0);
        const y = Math.random() * Math.max(ah, 0);
        const d = Math.hypot(x + btn.offsetWidth / 2 - px, y + btn.offsetHeight / 2 - py);
        if (d > best.d) best = { x, y, d };
      }
      place(best.x, best.y);
      escapesRef.current += 1;
      setEscapes(escapesRef.current);
    },
    [maxEscapes, place],
  );

  const onArenaMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const btn = btnRef.current;
    if (!btn || escapesRef.current >= maxEscapes) return;
    const r = btn.getBoundingClientRect();
    const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
    if (d < FLEE_RADIUS) flee({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="space-y-2">
      <div
        ref={arenaRef}
        onPointerMove={onArenaMove}
        className="relative h-44 touch-manipulation overflow-hidden rounded-3xl border border-dashed border-court-line bg-court-bg/60"
      >
        <button
          ref={btnRef}
          type="button"
          onPointerDown={(e) => !surrendered && flee({ x: e.clientX, y: e.clientY })}
          onFocus={() => !surrendered && flee(null)}
          onClick={() => surrendered && onCaught()}
          className={`absolute left-0 top-0 min-h-12 whitespace-nowrap rounded-2xl bg-court-gold px-5 font-bold text-court-bg shadow-lg transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none ${ready ? 'opacity-100' : 'opacity-0'}`}
        >
          {surrendered ? surrenderLabel : label}
        </button>
      </div>
      <p aria-live="polite" className="text-center text-sm text-court-snow/60">
        {surrendered
          ? 'El botón ha confesado. Ya no huye.'
          : escapes === 0
            ? 'Pulsa si te atreves.'
            : `Intentos de fuga del botón: ${escapes}`}
      </p>
    </div>
  );
}
