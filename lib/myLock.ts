/**
 * Marca local: "en este móvil hay un PIN de padres". Sirve para que la portada no enseñe nombres ni salas
 * (solo un botón "Zona de los padres"). El PIN en sí NO se guarda aquí: lo comprueba el servidor.
 */
const KEY = 'magic-lock';

export function isLockedDevice(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setLockedDevice(on: boolean): void {
  try {
    if (on) window.localStorage.setItem(KEY, '1');
    else window.localStorage.removeItem(KEY);
  } catch {
    /* sin almacenamiento */
  }
}
