'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ShareButtonsProps {
  url: string;
  text: string;
}

export function ShareButtons({ url, text }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Juicio Navideño', text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* usuario canceló o permisos denegados */
    }
  };

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;

  return (
    <div className="grid grid-cols-2 gap-3">
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#25d366] px-5 font-bold text-black active:scale-[0.98]"
      >
        WhatsApp
      </a>
      <Button variant="ghost" onClick={share}>
        {copied ? '¡Copiado!' : 'Compartir'}
      </Button>
    </div>
  );
}
