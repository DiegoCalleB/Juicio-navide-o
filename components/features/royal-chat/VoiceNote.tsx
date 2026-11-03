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
  /** URL real del audio. Sin ella, reproducción simulada (demo). */
  src?: string;
}

/** Nota de voz: onda determinista; con `src` reproduce audio real (progreso vía rAF). */
export function VoiceNote({ duration, seed, mine, king, src }: VoiceNoteProps) {
  const bars = useMemo(() => waveform(seed), [seed]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    audioRef.current?.pause();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const audio = audioRef.current;
    startRef.current = performance.now() - progress * duration * 1000;
    const tick = (now: number) => {
      const total = audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration;
      const p = audio ? Math.min(1, audio.currentTime / total) : Math.min(1, (now - startRef.current) / (duration * 1000));
      setProgress(p);
      const ended = audio ? audio.ended : p >= 1;
      if (ended) {
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

  const toggle = async () => {
    if (!src) return setPlaying((p) => !p);
    audioRef.current ??= new Audio(src);
    const audio = audioRef.current;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
      setFailed(false);
      setPlaying(true);
    } catch {
      setFailed(true);
    }
  };

  const played = Math.round(progress * BARS);
  const shown = playing || progress > 0 ? progress * duration : duration;
  const ink = mine ? 'bg-[#3a2208]' : 'bg-[#5b2a86]';
  const inkSoft = mine ? 'bg-[#3a2208]/30' : 'bg-[#5b2a86]/30';

  return (
    <div className="flex w-[15.5rem] items-center gap-2.5">
      {!mine && (
        <div className="relative">
          <RoyalAvatar king={king} size={42} />
          <span className="absolute -bottom-0.5 -right-0.5 grid size-[18px] place-items-center rounded-full bg-[#fbf5e6]">
            <span className="size-2.5 rounded-full" style={{ background: king.robe }} />
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pausar nota de voz' : 'Reproducir nota de voz'}
        className={`grid size-9 shrink-0 place-items-center rounded-full transition-transform active:scale-90 ${mine ? 'text-[#3a2208]' : 'text-[#5b2a86]'}`}
      >
        {playing ? <IconPause className="size-7" /> : <IconPlay className="size-7" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="relative flex h-7 items-center gap-[2px]" aria-hidden>
          {bars.map((h, i) => (
            <span key={i} className={`w-[3px] rounded-full transition-colors duration-150 ${i < played ? ink : inkSoft}`} style={{ height: `${h * 100}%` }} />
          ))}
          <span className={`absolute top-1/2 size-3 -translate-y-1/2 rounded-full shadow ${mine ? 'bg-[#3a2208]' : 'bg-[#7a3fb0]'}`} style={{ left: `calc(${progress * 100}% - 6px)` }} />
        </div>
        <p className={`mt-0.5 text-[11px] tabular-nums ${mine ? 'text-[#3a2208]/70' : 'text-[#5b3a1e]/70'}`}>
          {failed ? 'Toca otra vez' : fmt(shown)}
        </p>
      </div>
    </div>
  );
}
