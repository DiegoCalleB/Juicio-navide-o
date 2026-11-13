'use client';

import { useEffect, useState } from 'react';

interface Props {
  path: string;
  text: string;
  title: string;
  compact?: boolean;
  /** Imagen vertical (ruta) para Pinterest, Instagram y TikTok. */
  image?: string;
  /** Etiquetas para redes (#ElfoTravieso…). */
  hashtags?: string;
}

/**
 * Compartir en un toque: menú nativo del móvil (con la imagen, para Instagram/TikTok), WhatsApp, Pinterest,
 * Facebook, X, Telegram, copiar enlace y guardar la imagen.
 * Los enlaces compartidos llevan utm_source para poder medir de dónde llegan las visitas.
 */
export function ShareBar({ path, text, title, compact = false, image, hashtags }: Props) {
  const [origin, setOrigin] = useState('');
  const [canNative, setCanNative] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const url = `${origin}${path}`;
  const tagged = (source: string) => `${url}${url.includes('?') ? '&' : '?'}utm_source=${source}&utm_medium=share`;
  const withTags = hashtags ? `${text} ${hashtags}` : text;
  const imageUrl = image ? `${origin}${image}` : '';
  const enc = encodeURIComponent;

  const share = async () => {
    try {
      // Con imagen: en el móvil se puede publicar directamente en Instagram, TikTok o estados.
      if (image && typeof navigator.canShare === 'function') {
        const blob = await (await fetch(image)).blob();
        const file = new File([blob], 'trastada-del-elfo.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title, text: `${withTags} ${tagged('native')}` });
          return;
        }
      }
      await navigator.share({ title, text: withTags, url: tagged('native') });
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
  const ghost = `grid place-items-center rounded-xl border border-white/25 font-semibold text-[#fff6dc] hover:bg-white/5 active:scale-95 ${base}`;
  const links: { name: string; href: string; cls: string; full?: boolean }[] = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${enc(`${text} ${tagged('whatsapp')}`)}`, cls: 'bg-[#25d366] text-[#062b14]' },
    ...(image ? [{ name: 'Pinterest', href: `https://www.pinterest.com/pin/create/button/?url=${enc(tagged('pinterest'))}&media=${enc(imageUrl)}&description=${enc(withTags)}`, cls: 'bg-[#e60023] text-white' }] : []),
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(tagged('facebook'))}`, cls: 'bg-[#1877f2] text-white', full: true },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${enc(withTags)}&url=${enc(tagged('x'))}`, cls: 'bg-black text-white border border-white/25', full: true },
    { name: 'Telegram', href: `https://t.me/share/url?url=${enc(tagged('telegram'))}&text=${enc(text)}`, cls: 'bg-[#229ed9] text-white', full: true },
  ];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Compartir">
      {canNative && (
        <button type="button" onClick={share} className={`rounded-xl bg-[#f6d77a] font-bold text-[#2a0f4a] active:scale-95 ${base}`}>
          {image && !compact ? 'Compartir (Instagram, TikTok…)' : 'Compartir'}
        </button>
      )}
      {links
        .filter((l) => !compact || !l.full)
        .map((l) => (
          <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className={`grid place-items-center rounded-xl font-bold active:scale-95 ${l.cls} ${base}`}>
            {l.name}
          </a>
        ))}
      <button type="button" onClick={copy} className={ghost}>
        {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
      </button>
      {image && !compact && (
        <a href={`${image}?descargar=1`} download className={ghost}>
          Guardar imagen
        </a>
      )}
    </div>
  );
}
