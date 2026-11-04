'use client';

import { useEffect } from 'react';
import type { Character } from './types';
import { RoyalAvatar } from './RoyalAvatar';

const FLAKES = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 47) % 100}%`,
  size: 4 + (i % 4) * 2,
  duration: 5 + (i % 5) * 1.6,
  delay: -((i * 5) % 9),
}));

interface SurpriseRevealProps {
  character: Character;
  childName: string;
  text: string;
  onClose: () => void;
}

/**
 * Pantalla de sorpresa a pantalla completa: pensada para que los padres graben
 * la cara del niño con otro móvil. Se cierra al tocar (o a los 25 s).
 */
export function SurpriseReveal({ character, childName, text, onClose }: SurpriseRevealProps) {
  useEffect(() => {
    navigator.vibrate?.([200, 100, 200, 100, 400]);
    const t = setTimeout(onClose, 25_000);
    return () => clearTimeout(t);
  }, [onClose]);

  const { theme } = character;
  const place = character.group === 'noel' ? 'desde el Polo Norte' : 'desde Oriente';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Mensaje de ${character.name}`}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex cursor-pointer flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={{ background: `radial-gradient(ellipse at 50% 30%, ${theme.headerFrom}, ${theme.bg} 70%)` }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {FLAKES.map((f, i) => (
          <span key={i} className="anim-snow absolute top-0 rounded-full bg-white/85" style={{ left: f.left, width: f.size, height: f.size, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }} />
        ))}
      </div>

      <p className="anim-fade-up text-xs font-bold uppercase tracking-[.25em] text-[#f6d77a]" style={{ animationDelay: '0.1s' }}>
        Mensaje {place}
      </p>

      <div className="anim-judge-in mt-5" style={{ animationDelay: '0.4s' }}>
        <RoyalAvatar character={character} size={132} />
      </div>

      <h2 className="anim-fade-up mt-4 font-serif text-3xl text-[#fff6dc]" style={{ animationDelay: '1s' }}>
        {character.name} te ha escrito, {childName}
      </h2>

      <p
        className="anim-fade-up mt-5 max-w-sm rounded-3xl bg-[#fbf5e6] px-5 py-4 text-left text-[19px] font-semibold leading-snug text-[#2b1b0e] shadow-2xl"
        style={{ animationDelay: '1.8s' }}
      >
        {text}
      </p>

      <p className="anim-fade-up mt-6 text-sm text-[#fff6dc]/60" style={{ animationDelay: '3.2s' }}>
        Toca para contestar
      </p>
    </div>
  );
}
