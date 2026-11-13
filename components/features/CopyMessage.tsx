'use client';

import { useState } from 'react';

/** Copia el mensaje de ejemplo del elfo para pegarlo donde quieras. */
export function CopyMessage({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          /* sin permisos del portapapeles */
        }
      }}
      className="min-h-9 rounded-lg border border-[#f6d77a]/40 px-3 text-[12.5px] font-semibold text-[#f6d77a] active:scale-95"
    >
      {done ? '¡Copiado!' : 'Copiar mensaje'}
    </button>
  );
}
