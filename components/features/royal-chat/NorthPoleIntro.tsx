'use client';

import { useEffect, useState } from 'react';
import { playChime, unlockAudio } from '@/lib/chime';
import { vibrate } from '@/lib/haptics';
import { MagicScene } from './MagicScene';
import { RoyalAvatar } from './RoyalAvatar';
import { IconStar } from './icons';
import type { Character } from './types';

const CONNECT_MS = 2600;
const KEY_PREFIX = 'magic-intro:';

const seenKey = (token: string) => `${KEY_PREFIX}${token.slice(-16)}`;

function wasSeen(token: string): boolean {
  try {
    return window.localStorage.getItem(seenKey(token)) === '1';
  } catch {
    return false;
  }
}

function markSeen(token: string): void {
  try {
    window.localStorage.setItem(seenKey(token), '1');
  } catch {
    /* sin almacenamiento: se verá otra vez, no pasa nada */
  }
}

/**
 * Entrada mágica: los duendes "conectan" la línea con el Polo Norte y el niño
 * abre el mensaje con un toque (que además desbloquea el sonido). Se ve una
 * sola vez por dispositivo. El chat ya está cargando por debajo.
 */
export function NorthPoleIntro({ token, character, childName, onOpen }: { token: string; character: Character; childName: string; onOpen: () => void }) {
  const [phase, setPhase] = useState<'connecting' | 'ready' | 'leaving'>('connecting');
  const { theme, intro } = character;

  useEffect(() => {
    if (wasSeen(token)) {
      onOpen();
      return;
    }
    const t = setTimeout(() => setPhase('ready'), CONNECT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const open = () => {
    if (phase !== 'ready') return;
    unlockAudio();
    playChime();
    vibrate([60, 40, 120]);
    markSeen(token);
    void fetch(`/api/rooms/${token}/opened`, { method: 'POST' }).catch(() => undefined);
    setPhase('leaving');
    setTimeout(onOpen, 650);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Mensaje de ${character.name}`}
      className={`kid-font fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 text-center ${phase === 'leaving' ? 'anim-intro-out' : ''}`}
      style={{ background: `radial-gradient(ellipse at 50% 28%, ${theme.headerFrom}, ${theme.bg} 72%)` }}
    >
      <MagicScene sky={theme.sky} />
      {theme.sky === 'snow' && (
        <span aria-hidden className="anim-sleigh pointer-events-none absolute left-0 top-[14%] text-3xl">🛷🦌</span>
      )}

      <div className="relative flex w-full max-w-sm flex-col items-center">
        {phase === 'connecting' ? (
          <div role="status" aria-live="polite" className="anim-fade-up flex flex-col items-center">
            <div className="relative grid size-24 place-items-center">
              <span aria-hidden className="anim-spin-slow absolute inset-0 rounded-full border-2 border-dashed border-[#f6d77a]/60" />
              <span aria-hidden className="anim-float text-5xl">{character.introEmoji}</span>
            </div>
            <p className="mt-6 max-w-[17rem] font-serif text-[22px] leading-snug text-[#fff6dc]">{intro.connecting}</p>
            <div aria-hidden className="mt-5 flex gap-2">
              {[0, 1, 2].map((i) => (
                <IconStar key={i} className="anim-twinkle size-4 text-[#f6d77a]" style={{ animationDelay: `${i * 0.35}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="anim-fade-up flex flex-col items-center">
            <p className="text-[13px] font-bold uppercase tracking-[.22em] text-[#f6d77a]">{intro.ready}</p>
            <div className="anim-float mt-5">
              <RoyalAvatar character={character} size={118} />
            </div>
            <h1 className="mt-4 font-serif text-[30px] leading-tight text-[#fff6dc]">
              {childName}, tienes un mensaje {character.deName}
            </h1>

            <button
              type="button"
              onClick={open}
              aria-label={intro.button}
              className="relative mt-8 grid size-28 place-items-center rounded-full active:scale-95"
            >
              <span aria-hidden className="anim-seal-pulse absolute inset-0 rounded-full" style={{ background: theme.robe }} />
              <span aria-hidden className="anim-seal-pulse absolute inset-0 rounded-full [animation-delay:1.1s]" style={{ background: theme.robe }} />
              <span
                className="relative grid size-28 place-items-center rounded-full border-4 border-[#f6d77a]/70 shadow-[0_10px_30px_rgba(0,0,0,.5),inset_0_-6px_12px_rgba(0,0,0,.35),inset_0_6px_12px_rgba(255,255,255,.25)]"
                style={{ background: `radial-gradient(circle at 35% 30%, ${theme.robe}, ${theme.headerTo})` }}
              >
                <IconStar className="size-12 text-[#f6d77a] drop-shadow" />
              </span>
            </button>
            <p className="mt-5 text-[17px] font-bold text-[#fff6dc]">Toca para abrir</p>
          </div>
        )}
      </div>
    </div>
  );
}
