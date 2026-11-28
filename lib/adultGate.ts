/**
 * Puerta de la zona de mayores (ver la REGLA DE ORO en AGENTS.md).
 *
 * Todo lo que explica cómo funciona la magia (crear el portal, precios, instrucciones de las trastadas,
 * paneles de los padres, textos legales) está detrás de esta puerta. Para entrar basta con que Chispa
 * haya oído una edad de mayor (cookie firmada, nunca se guarda la edad); quien dice ser menor no entra.
 * La sesión caduca tras 30 min sin uso.
 *
 * Funciona en el middleware (edge) y en el servidor: solo Web Crypto, sin módulos de Node.
 */

export const GATE_COOKIE = 'lm_mayores';
/** Sin usar la zona de mayores durante este tiempo, la puerta se vuelve a cerrar. */
export const GATE_IDLE_MS = 30 * 60_000;

/** Rutas que solo se ven tras la puerta. */
export const ADULT_PATHS = ['/crear', '/precios', '/prueba', '/ideas-elfo', '/familia', '/paje', '/pase', '/privacidad', '/terminos', '/demo'];

export function isAdultPath(pathname: string): boolean {
  if (/\/manifest\.webmanifest$/.test(pathname)) return false; // el navegador lo pide sin pasar por la puerta
  return ADULT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Solo las pruebas automáticas (almacén en memoria) pueden apagar la puerta. En producción, siempre activa. */
export function gateEnabled(): boolean {
  return !(process.env.ADULT_GATE === '0' && process.env.ROOMS_STORE === 'memory');
}

function secret(): string {
  const s = process.env.ADULT_GATE_SECRET || process.env.FINGERPRINT_SALT;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('Falta ADULT_GATE_SECRET (o FINGERPRINT_SALT) de al menos 16 caracteres.');
  return 'lm-dev-only-secret-change-me';
}

const enc = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;
let keyFor = '';
function key(): Promise<CryptoKey> {
  const s = `adult-gate:${secret()}`;
  if (!keyPromise || keyFor !== s) {
    keyFor = s;
    keyPromise = crypto.subtle.importKey('raw', enc.encode(s), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  }
  return keyPromise;
}

function b64url(buf: ArrayBuffer): string {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(text: string): Promise<string> {
  return b64url(await crypto.subtle.sign('HMAC', await key(), enc.encode(text)));
}

/** Comparación en tiempo constante. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ── Sesión ────────────────────────────────────────────────────────────────

export async function newSession(now = Date.now()): Promise<string> {
  const ts = String(now);
  return `${ts}.${await sign(`session|${ts}`)}`;
}

export async function sessionValid(value: string | undefined, now = Date.now()): Promise<boolean> {
  if (!value) return false;
  const [ts, sig] = value.split('.');
  if (!ts || !sig || !/^\d{10,16}$/.test(ts)) return false;
  const t = Number(ts);
  if (t > now + 60_000 || now - t > GATE_IDLE_MS) return false;
  return same(sig, await sign(`session|${ts}`));
}

export const sessionCookie = (value: string) => ({
  name: GATE_COOKIE,
  value,
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  // Sin maxAge: se borra al cerrar el navegador. Además, el servidor la da por caducada a los 30 min sin uso.
});

/** Solo se permite volver a rutas internas (nunca a otra web). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/mayores';
  return next;
}

// ── Edad (la pregunta la hace Chispa) ─────────────────────────────────────

/** Mayoría de edad: desde aquí se sigue a la cuenta de cabeza; por debajo, la puerta queda cerrada en ese dispositivo. */
export const ADULT_AGE = 18;
export const AGE_COOKIE = 'lm_edad';
const AGE_MS = 30 * 24 * 60 * 60_000;
export type AgeKind = 'ok' | 'menor';

export async function newAgeToken(kind: AgeKind, now = Date.now()): Promise<string> {
  const ts = String(now);
  return `${kind}.${ts}.${await sign(`age|${kind}|${ts}`)}`;
}

/** 'ok' (dijo ser mayor), 'menor' (dijo ser menor) o null (no contestó, caducó o está manipulada). */
export async function ageStatus(value: string | undefined, now = Date.now()): Promise<AgeKind | null> {
  if (!value) return null;
  const [kind, ts, sig] = value.split('.');
  if ((kind !== 'ok' && kind !== 'menor') || !ts || !sig || !/^\d{10,16}$/.test(ts)) return null;
  const t = Number(ts);
  if (t > now + 60_000 || now - t > AGE_MS) return null;
  return same(sig, await sign(`age|${kind}|${ts}`)) ? kind : null;
}

export const ageCookie = (value: string) => ({
  name: AGE_COOKIE,
  value,
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: AGE_MS / 1000,
});
