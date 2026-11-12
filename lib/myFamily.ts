/**
 * Enlace de familia guardado en ESTE móvil (solo navegador). Permite añadir las salas nuevas a la misma
 * familia y volver a verlas todas. Es un enlace secreto: no sale del móvil.
 */
const KEY = 'magic-family';

export function loadFamily(): string | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v && /^[A-Za-z0-9_-]{43}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveFamily(token: string): void {
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    /* sin almacenamiento */
  }
}
