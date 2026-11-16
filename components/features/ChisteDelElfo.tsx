'use client';

import { useState } from 'react';
import { JOKES } from '@/lib/poloNorte';

/** Un chiste cada vez: pulsa y sale otro (nunca el mismo dos veces seguidas). */
export function ChisteDelElfo() {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const joke = JOKES[i]!;
  const next = () => {
    let n = i;
    while (n === i) n = Math.floor(Math.random() * JOKES.length);
    setI(n);
    setShown(false);
  };
  return (
    <div className="rounded-3xl border border-[#f6d77a]/25 bg-[#081d27]/80 p-5 text-center">
      <p className="font-serif text-[21px] leading-snug" data-testid="chiste-pregunta">{joke.q}</p>
      {shown ? (
        <p className="mt-3 font-serif text-[19px] italic leading-snug text-[#7ee2a8]" data-testid="chiste-respuesta">{joke.a}</p>
      ) : (
        <button type="button" onClick={() => setShown(true)} className="mt-4 min-h-11 rounded-full bg-[#7ee2a8] px-5 font-bold text-[#0d2b3a] active:scale-95">
          ¿Y qué dice?
        </button>
      )}
      <div className="mt-4">
        <button type="button" onClick={next} className="min-h-11 rounded-full border border-[#f6d77a]/50 px-5 font-semibold text-[#f6d77a] active:scale-95">
          Otro chiste
        </button>
      </div>
    </div>
  );
}
