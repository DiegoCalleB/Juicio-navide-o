'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/LocaleProvider';
import { LOCALE_COOKIE, LOCALES, type Locale } from '@/lib/i18n';

/** Selector discreto de variante de idioma. Guarda la preferencia en una cookie funcional de 1 año. */
export function LocaleSwitch() {
  const current = useLocale();
  const router = useRouter();

  const choose = (id: Locale) => {
    if (id === current) return;
    try {
      document.cookie = `${LOCALE_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* sin cookies: se queda el idioma detectado */
    }
    router.refresh();
  };

  return (
    <div role="radiogroup" aria-label="Idioma" className="mx-auto flex w-fit gap-1 rounded-full border border-white/15 bg-black/20 p-1 text-[12.5px]">
      {LOCALES.map((l) => (
        <button
          key={l.id}
          type="button"
          role="radio"
          aria-checked={current === l.id}
          onClick={() => choose(l.id)}
          className={`rounded-full px-3 py-1 font-semibold transition-colors ${current === l.id ? 'bg-[#f6d77a] text-[#2a0f4a]' : 'text-[#fff6dc]/70'}`}
        >
          <span aria-hidden>{l.flag}</span> {l.label}
        </button>
      ))}
    </div>
  );
}
