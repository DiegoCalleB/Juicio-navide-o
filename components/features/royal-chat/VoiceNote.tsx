'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as player from '@/lib/voicePlayer';
import { IconPause, IconPlay } from './icons';
import { RoyalAvatar } from './RoyalAvatar';
import type { Character } from './types';

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
  /** Identificador estable del mensaje (para que suene una sola nota a la vez). */
  id?: string;
  /** Notas seguidas del mismo remitente que sonarán solas al terminar esta. */
  followUps?: player.Track[];
  duration: number;
  seed: number;
  mine: boolean;
  character: Character;
  /** URL real del audio. Sin ella, reproducción simulada (demo). */
  src?: string;
}

/** Nota de voz: onda determinista; con `src` reproduce audio real (progreso vía rAF). */
export function VoiceNote({ id, followUps, duration, seed, mine, character, src }: VoiceNoteProps) {
  const bars = useMemo(() => waveform(seed), [seed]);
  const real = Boolean(src && id);
  const [simPlaying, setSimPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, force] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  // Con audio real, el estado vive en el reproductor compartido.
  useEffect(() => (real ? player.subscribe(() => force((n) => n + 1)) : undefined), [real]);

  const shared = player.getState();
  const isCurrent = real && shared.id === id;
  const playing = real ? isCurrent && shared.playing : simPlaying;
  const failed = real && shared.failedId === id;

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  useEffect(() => {
    if (!playing) return;
    startRef.current = performance.now() - progress * duration * 1000;
    const tick = (now: number) => {
      const p = real ? player.getProgress(id!, duration) : Math.min(1, (now - startRef.current) / (duration * 1000));
      setProgress(p);
      if (!real && p >= 1) {
        setSimPlaying(false);
        setTimeout(() => setProgress(0), 400);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration]);

  // Al terminar (o ceder el turno a otra nota) la onda vuelve al principio.
  useEffect(() => {
    if (real && !playing && progress > 0 && !(isCurrent && shared.id === id)) {
      const t = setTimeout(() => setProgress(0), 300);
      return () => clearTimeout(t);
    }
  }, [real, playing, progress, isCurrent, shared.id, id]);

  const toggle = async () => {
    if (!real) return setSimPlaying((p) => !p);
    if (playing) return player.pause();
    await player.play({ id: id!, src: src! }, followUps ?? []);
  };

  const played = Math.round(progress * BARS);
  const shown = playing || progress > 0 ? progress * duration : duration;
  const inkColor = mine ? '#3a2208' : character.theme.ink;
  const inkSoftColor = `color-mix(in srgb, ${inkColor} 30%, transparent)`;

  return (
    <div className="flex w-[15.5rem] items-center gap-2.5">
      {!mine && (
        <div className="relative">
          <RoyalAvatar character={character} size={42} />
          <span className="absolute -bottom-0.5 -right-0.5 grid size-[18px] place-items-center rounded-full bg-[#fbf5e6]">
            <span className="size-2.5 rounded-full" style={{ background: character.theme.ink }} />
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pausar nota de voz' : 'Reproducir nota de voz'}
        className="grid size-9 shrink-0 place-items-center rounded-full transition-transform active:scale-90"
        style={{ color: inkColor }}
      >
        {playing ? <IconPause className="size-7" /> : <IconPlay className="size-7" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="relative flex h-7 items-center gap-[2px]" aria-hidden>
          {bars.map((h, i) => (
            <span key={i} className="w-[3px] rounded-full transition-colors duration-150" style={{ height: `${h * 100}%`, background: i < played ? inkColor : inkSoftColor }} />
          ))}
          <span className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full shadow" style={{ background: inkColor, left: `calc(${progress * 100}% - 6px)` }} />
        </div>
        <p className={`mt-0.5 text-[11px] tabular-nums ${mine ? 'text-[#3a2208]/70' : 'text-[#5b3a1e]/70'}`}>
          {failed ? 'Toca otra vez' : fmt(shown)}
        </p>
      </div>
    </div>
  );
}
