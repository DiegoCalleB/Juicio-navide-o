'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { IconPause, IconPlay } from './icons';
import { RoyalAvatar } from './RoyalAvatar';
import type { King } from './types';

const BARS = 34;

function waveform(seed: number): number[] {
  let s = seed || 1;
  return Array.from({ length: BARS }, (_, i) => {
    s = (s * 16807) % 2147483647;
    const r = s / 2147483647;
    const envelope = Math.sin((i / (BARS - 1)) * Math.PI) * 0.55 + 0.45;
    return Math.max(0.14, Math.min(1, (0.35 + r * 0.65) * envelope));
  });
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

interface VoiceNoteProps {
  duration: number;
  seed: number;
  mine: boolean;
  king: King;
}

/** Nota de voz: onda determinista, progreso con rAF (sin re-render por frame del padre). */
export function VoiceNote({ duration, seed, mine, king }: VoiceNoteProps) {
  const bars = useMemo(() => waveform(seed), [seed]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    startRef.current = performance.now() - progress * duration * 1000;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startRef.current) / (duration * 1000));
      setProgress(p);
      if (p >= 1) {
        setPlaying(false);
        setTimeout(() => setProgress(0), 400);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration]);

  const played = Math.round(progress * BARS);
  const shown = playing || progress > 0 ? progress * duration : duration;

  return (
    <div className="flex w-[15.5rem] items-center gap-2.5">
      {!mine && (
        <div className="relative">
          <RoyalAvatar king={king} size={42} />
          <span className="absolute -bottom-0.5 -right-0.5 grid size-[18px] place-items-center rounded-full bg-[#fbf5e6]">
            <span className="size-2.5 rounded-full bg-[#7a3fb0]" />
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? 'Pausar nota de voz' : 'Reproducir nota de voz'}
        className={`grid size-9 shrink-0 place-items-center rounded-full transition-transform active:scale-90 ${mine ? 'text-[#3a2208]' : 'text-[#5b2a86]'}`}
      >
        {playing ? <IconPause className="size-7" /> : <IconPlay className="size-7" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="relative flex h-7 items-center gap-[2px]" aria-hidden>
          {bars.map((h, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full transition-colors duration-150 ${i < played ? (mine ? 'bg-[#3a2208]' : 'bg-[#5b2a86]') : mine ? 'bg-[#3a2208]/30' : 'bg-[#5b2a86]/30'}`}
              style={{ height: `${h * 100}%` }}
            />
          ))}
          <span
            className={`absolute top-1/2 size-3 -translate-y-1/2 rounded-full shadow ${mine ? 'bg-[#3a2208]' : 'bg-[#7a3fb0]'}`}
            style={{ left: `calc(${progress * 100}% - 6px)` }}
          />
        </div>
        <p className={`mt-0.5 text-[11px] tabular-nums ${mine ? 'text-[#3a2208]/70' : 'text-[#5b3a1e]/70'}`}>{fmt(shown)}</p>
      </div>
    </div>
  );
}
