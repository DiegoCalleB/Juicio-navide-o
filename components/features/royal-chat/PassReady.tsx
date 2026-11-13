'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCheckoutReturn, savePass, setCheckoutReturn } from '@/lib/myPass';
import { R } from '@/components/LocaleProvider';

const giftText = (link: string) =>
  `¡Te regalo un Pase de Navidad de Línea Mágica! Con él, tus peques pueden escribirse en directo con Papá Noel, el elfo o los Reyes Magos (tú contestas en secreto). Ábrelo aquí: ${link}`;

export function PassReady({ passToken, passLink, giftLink }: { passToken: string | null; passLink: string | null; giftLink: string | null }) {
  const [back, setBack] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (passToken) savePass(passToken);
    setBack(getCheckoutReturn());
    setCheckoutReturn(null);
  }, [passToken]);

  if (!passToken || !passLink || !giftLink) {
    return (
      <main className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#0a1220] px-4 text-center text-[#e8f1ff]">
        <div className="max-w-sm space-y-4">
          <h1 className="text-2xl font-bold">El pago no se ha completado</h1>
          <p className="opacity-75">No se ha hecho ningún cargo. Puedes volver e intentarlo de nuevo.</p>
          <Link href="/" className="inline-flex min-h-12 items-center rounded-2xl bg-[#5eead4] px-5 font-bold text-[#04302b]">Volver</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-40 overflow-y-auto bg-[#0a1220] text-[#e8f1ff]">
      <div className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-10">
        <p className="text-center text-4xl" aria-hidden>✨</p>
        <h1 className="text-center text-2xl font-bold">¡Ya tienes tu Pase de Navidad!</h1>
        <p className="text-center text-[14px] opacity-75">
          <R>{back ? 'Tu sala ya no tiene límite. ' : ''}Las salas que crees desde este móvil tampoco tendrán límite hasta el 20 de enero.</R>
        </p>

        {back && (
          <Link href={back} className="flex min-h-12 items-center justify-center rounded-2xl bg-[#5eead4] font-bold text-[#04302b]">
            Volver a mi panel
          </Link>
        )}
        {!back && (
          <Link href="/#crear" className="flex min-h-12 items-center justify-center rounded-2xl bg-[#5eead4] font-bold text-[#04302b]">
            Crear una sala
          </Link>
        )}

        <section className="space-y-2.5 rounded-2xl border border-[#f6d77a]/40 bg-[#f6d77a]/[.07] p-4 text-[13px]">
          <p className="text-[15px] font-bold text-[#f6d77a]">🎁 Regala la magia a otra familia</p>
          <p className="opacity-80">Tu pase incluye otro de regalo. Mándaselo a quien quieras: lo abre y ya puede empezar.</p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(giftText(giftLink))}`}
            className="flex min-h-11 items-center justify-center rounded-xl bg-[#25d366] font-bold text-[#062b14]"
          >
            Regalar por WhatsApp
          </a>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(giftLink);
                setCopied(true);
              } catch {
                /* sin portapapeles */
              }
            }}
            className="min-h-10 w-full rounded-xl bg-white/10 font-semibold"
          >
            {copied ? '¡Copiado!' : 'Copiar el enlace de regalo'}
          </button>
        </section>

        <section className="space-y-2 rounded-2xl border border-white/15 bg-white/[.04] p-4 text-[13px]">
          <p className="font-semibold">Guarda tu pase</p>
          <p className="opacity-70"><R>Ya está guardado en este móvil. Si quieres usarlo en otro, mándatelo:</R></p>
          <a
            href={`mailto:?subject=${encodeURIComponent('Mi Pase de Navidad')}&body=${encodeURIComponent(passLink)}`}
            className="flex min-h-10 items-center justify-center rounded-xl border border-[#5eead4]/40 font-semibold text-[#5eead4]"
          >
            Enviármelo por correo
          </a>
        </section>
        <p className="text-center text-[11px] opacity-50">Recibirás el recibo de Stripe en tu correo.</p>
      </div>
    </main>
  );
}
