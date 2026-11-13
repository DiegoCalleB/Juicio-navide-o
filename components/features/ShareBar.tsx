'use client';

import { useEffect, useState } from 'react';

/**
 * Compartir en un toque: menú nativo del móvil (WhatsApp, Instagram, mensajes…), WhatsApp directo y copiar enlace.
 * Los enlaces compartidos llevan utm_source para poder medir de dónde llegan las visitas.
 */
export function ShareBar({ path, text, title, compact = false }: { path: string; text: string; title: string; compact?: boolean }) {
  const [url, setUrl] = useState(path);
  const [canNative, setCanNative] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
    setCanNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, [path]);

  const tagged = (source: string) => `${url}${url.includes('?') ? '&' : '?'}utm_source=${source}&utm_medium=share`;

  const share = async () => {
    try {
      await navigator.share({ title, text, url: tagged('native') });
    } catch {
      /* la persona cerró el menú */
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tagged('copy'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin permisos */
    }
  };

  const base = compact ? 'min-h-9 px-3 text-[12.5px]' : 'min-h-11 px-4 text-[14px]';
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Compartir">
      {canNative && (
        <button type="button" onClick={share} className={`rounded-xl bg-[#f6d77a] font-bold text-[#2a0f4a] active:scale-95 ${base}`}>
          Compartir
        </button>
      )}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${text} ${tagged('whatsapp')}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`grid place-items-center rounded-xl bg-[#25d366] font-bold text-[#062b14] active:scale-95 ${base}`}
      >
        WhatsApp
      </a>
      <button type="button" onClick={copy} className={`rounded-xl border border-white/25 font-semibold text-[#fff6dc] active:scale-95 ${base}`}>
        {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
      </button>
    </div>
  );
}
