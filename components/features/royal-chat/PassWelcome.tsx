'use client';

import { useEffect, useState } from 'react';
import { savePass } from '@/lib/myPass';
import { R } from '@/components/LocaleProvider';

/**
 * Llega un enlace de pase (propio o regalado: /?pase=…). Se comprueba, se guarda en este móvil
 * y se quita de la barra de direcciones para que no se comparta por error.
 */
export function PassWelcome() {
  const [state, setState] = useState<'none' | 'ok' | 'bad'>('none');

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('pase');
    if (!token) return;
    url.searchParams.delete('pase');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    fetch(`/api/pass/${encodeURIComponent(token)}`)
      .then((r) => r.json() as Promise<{ ok: boolean; data?: { state: string } }>)
      .then((j) => {
        if (j.ok && j.data?.state === 'ok') {
          savePass(token);
          setState('ok');
        } else setState('bad');
      })
      .catch(() => setState('bad'));
  }, []);

  if (state === 'none') return null;
  return state === 'ok' ? (
    <div role="status" className="mb-6 rounded-2xl border border-[#f6d77a]/50 bg-[#f6d77a]/10 p-4 text-center text-[14px] text-[#fff6dc]">
      <p className="text-lg font-bold text-[#f6d77a]">🎁 ¡Tienes un Pase de Navidad!</p>
      <p className="mt-1 opacity-85"><R>Ya está guardado en este móvil. Crea tu sala abajo: no tendrá límite hasta el 20 de enero.</R></p>
    </div>
  ) : (
    <div role="status" className="mb-6 rounded-2xl border border-[#ff8a8c]/40 bg-[#ff8a8c]/10 p-4 text-center text-[13px] text-[#fff6dc]/85">
      Este pase no es válido o ya ha caducado. Aun así, puedes probar gratis.
    </div>
  );
}
