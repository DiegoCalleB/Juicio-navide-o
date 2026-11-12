import 'server-only';
import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, localeFromAcceptLanguage, parseLocale, type Locale } from '@/lib/i18n';

/** Idioma de la petición: la preferencia elegida (cookie) y, si no hay, el idioma del navegador. */
export async function getRequestLocale(): Promise<Locale> {
  try {
    const chosen = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
    if (chosen) return chosen;
    return localeFromAcceptLanguage((await headers()).get('accept-language'));
  } catch {
    return DEFAULT_LOCALE;
  }
}
