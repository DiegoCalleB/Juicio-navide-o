'use client';

import { Children, cloneElement, createContext, isValidElement, useCallback, useContext, type ReactNode } from 'react';
import { DEFAULT_LOCALE, regionalize, type Locale } from '@/lib/i18n';

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Idioma de esta parte de la app. Se puede anidar: una sala fuerza el suyo sea cual sea el móvil. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = (): Locale => useContext(LocaleContext);

/** `r('texto en español de España')` → texto en la variante del idioma actual. */
export function useRegional(): (text: string) => string {
  const locale = useLocale();
  return useCallback((text: string) => regionalize(text, locale), [locale]);
}

/** Adapta al idioma actual todo el texto que envuelve (también el de elementos anidados como <strong>). */
export function R({ children }: { children: ReactNode }) {
  const locale = useLocale();
  if (locale === 'es') return <>{children}</>;
  const walk = (node: ReactNode): ReactNode => {
    if (typeof node === 'string') return regionalize(node, locale);
    if (isValidElement<{ children?: ReactNode }>(node) && node.props.children !== undefined) {
      return cloneElement(node, undefined, Children.map(node.props.children, walk));
    }
    return node;
  };
  return <>{Children.map(children, walk)}</>;
}
