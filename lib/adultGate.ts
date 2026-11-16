/**
 * Puerta de la zona de mayores (ver la REGLA DE ORO en AGENTS.md).
 *
 * Todo lo que explica cómo funciona la magia (crear la sala, precios, instrucciones de las trastadas,
 * paneles de los padres, textos legales) está detrás de esta puerta. Para entrar hay que resolver de
 * cabeza una cuenta sencilla para un adulto, en poco tiempo (como las «parental gates» de las apps
 * infantiles). La respuesta se comprueba en el servidor y la sesión caduca tras 30 min sin uso.
 *
 * Funciona en el middleware (edge) y en el servidor: solo Web Crypto, sin módulos de Node.
 */

export const GATE_COOKIE = 'lm_mayores';
/** Sin usar la zona de mayores durante este tiempo, la puerta se vuelve a cerrar. */
export const GATE_IDLE_MS = 30 * 60_000;
/** Tiempo para contestar la cuenta (el servidor da unos segundos de margen por la red). */
export const GATE_ANSWER_SECONDS = 4;
const ANSWER_GRACE_MS = 3_000;

/** Rutas que solo se ven tras la puerta. */
export const ADULT_PATHS = ['/crear', '/precios', '/ideas-elfo', '/familia', '/paje', '/pase', '/privacidad', '/terminos', '/demo'];

export function isAdultPath(pathname: string): boolean {
  if (/\/manifest\.webmanifest$/.test(pathname)) return false; // el navegador lo pide sin pasar por la puerta
  return ADULT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Solo las pruebas automáticas (almacén en memoria) pueden apagar la puerta. En producción, siempre activa. */
export function gateEnabled(): boolean {
  return !(process.env.ADULT_GATE === '0' && process.env.ROOMS_STORE === 'memory');
}

function secret(): string {
  return process.env.ADULT_GATE_SECRET || process.env.FINGERPRINT_SALT || 'lm-dev-only-secret-change-me';
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

// ── Pregunta ──────────────────────────────────────────────────────────────

export interface Challenge {
  question: string;
  token: string;
  seconds: number;
}

function rand(min: number, max: number): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return min + (a[0]! % (max - min + 1));
}

/** Una cuenta que un adulto resuelve de cabeza en unos segundos y un niño pequeño no. */
export async function newChallenge(now = Date.now()): Promise<Challenge> {
  let question: string;
  let answer: number;
  const kind = rand(0, 2);
  if (kind === 0) {
    const a = rand(12, 19), b = rand(3, 6);
    question = `${a} × ${b}`;
    answer = a * b;
  } else if (kind === 1) {
    const a = rand(41, 89), b = rand(12, 38);
    question = `${a} − ${b}`;
    answer = a - b;
  } else {
    const a = rand(31, 69), b = rand(14, 39);
    question = `${a} + ${b}`;
    answer = a + b;
  }
  const exp = now + GATE_ANSWER_SECONDS * 1000 + ANSWER_GRACE_MS;
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(9)).buffer);
  const token = `${nonce}.${exp}.${await sign(`challenge|${nonce}|${exp}|${answer}`)}`;
  return { question, token, seconds: GATE_ANSWER_SECONDS };
}

export async function checkAnswer(token: string, answer: string, now = Date.now()): Promise<'ok' | 'wrong' | 'expired'> {
  const [nonce, expStr, sig] = token.split('.');
  if (!nonce || !expStr || !sig) return 'wrong';
  if (now > Number(expStr)) return 'expired';
  const n = answer.trim().replace(/\s+/g, '');
  if (!/^-?\d{1,4}$/.test(n)) return 'wrong';
  return same(sig, await sign(`challenge|${nonce}|${expStr}|${Number(n)}`)) ? 'ok' : 'wrong';
}

/** Solo se permite volver a rutas internas (nunca a otra web). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/mayores';
  return next;
}
