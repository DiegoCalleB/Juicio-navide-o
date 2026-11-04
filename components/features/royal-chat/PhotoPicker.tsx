'use client';

import { useEffect, useRef, useState } from 'react';
import { IconCamera } from './icons';

interface Props {
  onPick: (file: File) => void;
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
  /** Texto accesible del botón. */
  label?: string;
}

/**
 * Botón de foto con dos caminos: hacer una foto con la cámara (en el móvil abre la cámara
 * directamente) o elegir una imagen ya guardada. En ordenador ambos abren el selector de archivos.
 */
export function PhotoPicker({ onPick, disabled, className, iconClassName = 'size-6', label = 'Enviar una foto' }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const picked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setOpen(false);
    if (file) onPick(file);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <input ref={galleryRef} type="file" accept="image/*" onChange={picked} className="sr-only" tabIndex={-1} aria-hidden data-testid="photo-input" />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={picked} className="sr-only" tabIndex={-1} aria-hidden data-testid="camera-input" />
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} disabled={disabled} onClick={() => setOpen((o) => !o)} className={className}>
        <IconCamera className={iconClassName} />
      </button>
      {open && (
        <div role="menu" className="absolute bottom-full right-0 z-30 mb-2 w-52 animate-pop overflow-hidden rounded-2xl border border-black/10 bg-[#fbf5e6] text-[#2b1b0e] shadow-2xl">
          <button type="button" role="menuitem" onClick={() => cameraRef.current?.click()} className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-[15px] font-semibold active:bg-black/5">
            <span aria-hidden className="text-xl">📷</span> Hacer una foto
          </button>
          <button type="button" role="menuitem" onClick={() => galleryRef.current?.click()} className="flex min-h-12 w-full items-center gap-3 border-t border-black/10 px-4 text-left text-[15px] font-semibold active:bg-black/5">
            <span aria-hidden className="text-xl">🖼️</span> Elegir una foto
          </button>
        </div>
      )}
    </div>
  );
}
