'use client';

import { useEffect, useRef, useState } from 'react';

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'magic-install-dismissed';
const DISMISS_DAYS = 14;

/**
 * "Instala Línea Mágica": en Android y ordenador abre el diálogo del navegador; en iPhone/iPad (que no lo tiene)
 * enseña los dos pasos. Se oculta si ya está instalada o si se descartó hace poco.
 */
export function InstallApp({ what = 'Línea Mágica', tone = 'landing' }: { what?: string; tone?: 'landing' | 'panel' }) {
  const prompt = useRef<InstallEvent | null>(null);
  const done = useRef(false);
  const [mode, setMode] = useState<'none' | 'prompt' | 'ios'>('none');
  const [steps, setSteps] = useState(false);

  useEffect(() => {
    let standalone = false;
    let dismissed = false;
    try {
      standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const at = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
      dismissed = at > 0 && Date.now() - at < DISMISS_DAYS * 86_400_000;
    } catch {
      /* sin almacenamiento */
    }
    if (standalone || dismissed) return;

    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const isSafariIos = isIos && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    if (isSafariIos) setMode('ios');

    const onPrompt = (e: Event) => {
      e.preventDefault();
      if (done.current) return;
      prompt.current = e as InstallEvent;
      setMode('prompt');
    };
    const onInstalled = () => {
      done.current = true;
      setMode('none');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (mode === 'none') return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* sin almacenamiento */
    }
    setMode('none');
  };
  const install = async () => {
    const ev = prompt.current;
    if (!ev) return;
    try {
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      if (outcome === 'accepted') {
        done.current = true;
        setMode('none');
      }
    } catch {
      /* el navegador rechazó mostrar el diálogo */
    }
    prompt.current = null;
  };

  const box = tone === 'panel' ? 'border-[#5eead4]/30 bg-[#5eead4]/[.06] text-[#e8f1ff]' : 'border-[#f6d77a]/35 bg-[#f6d77a]/[.07] text-[#fff6dc]';
  const accent = tone === 'panel' ? 'text-[#5eead4]' : 'text-[#f6d77a]';
  const btn = tone === 'panel' ? 'bg-[#5eead4] text-[#04302b]' : 'bg-[#f6d77a] text-[#2a0f4a]';

  return (
    <section aria-label="Instalar la app" className={`relative rounded-2xl border p-3.5 text-[13.5px] leading-snug ${box}`}>
      <button type="button" onClick={dismiss} aria-label="No volver a mostrar" className="absolute right-2 top-2 grid size-7 place-items-center rounded-full text-[15px] opacity-60 hover:opacity-100">
        ✕
      </button>
      <p className={`pr-7 font-bold ${accent}`}>📲 Instala {what} en tu móvil</p>
      <p className="mt-0.5 pr-6 opacity-75">Un icono en tu pantalla de inicio, como cualquier app. Sin tiendas ni descargas.</p>
      {mode === 'prompt' ? (
        <button type="button" onClick={install} className={`mt-2.5 min-h-10 rounded-xl px-4 font-bold active:scale-95 ${btn}`}>
          Instalar
        </button>
      ) : (
        <>
          <button type="button" onClick={() => setSteps((v) => !v)} aria-expanded={steps} className={`mt-2.5 min-h-10 rounded-xl px-4 font-bold active:scale-95 ${btn}`}>
            {steps ? 'Ocultar pasos' : 'Cómo instalarla'}
          </button>
          {steps && (
            <ol className="mt-2.5 list-decimal space-y-1 pl-5 opacity-90">
              <li>Pulsa el botón <strong>Compartir</strong> de Safari (el cuadrado con la flecha hacia arriba).</li>
              <li>Elige <strong>«Añadir a pantalla de inicio»</strong> y confirma.</li>
            </ol>
          )}
        </>
      )}
    </section>
  );
}
