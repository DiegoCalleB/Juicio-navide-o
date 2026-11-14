import 'server-only';
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/** PIN de los padres: de 4 a 6 cifras. */
export const PIN_REGEX = /^\d{4,6}$/;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para que se lea bien

/** Tiempo que dura el panel abierto tras poner el PIN. Después vuelve a pedirlo. */
export const UNLOCK_MINUTES = 30;

export function hashSecret(value: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(value, salt, 32, { N: 16384 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifySecret(value: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [kind, saltB64, hashB64] = stored.split('$');
  if (kind !== 'scrypt' || !saltB64 || !hashB64) return false;
  try {
    const expected = Buffer.from(hashB64, 'base64');
    const actual = scryptSync(value, Buffer.from(saltB64, 'base64'), expected.length, { N: 16384 });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Código de rescate de 12 caracteres (XXXX-XXXX-XXXX), para quien olvide el PIN. */
export function newRecoveryCode(): string {
  const bytes = randomBytes(12);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8, 12)].map((g) => g.join('')).join('-');
}

export const normalizeRecovery = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');

const secret = () => {
  const s = process.env.PASS_SECRET || process.env.FINGERPRINT_SALT;
  if (!s || s.length < 16) throw new Error('Falta PASS_SECRET (o FINGERPRINT_SALT) para el bloqueo de padres.');
  return s;
};

/** Nombre de la cookie de desbloqueo (una por familia o sala; no revela el identificador). */
export const unlockCookieName = (scope: string) => `lm_u_${createHash('sha256').update(scope).digest('hex').slice(0, 12)}`;

/** Valor firmado: caduca solo y no sirve para otra sala. */
export function signUnlock(scope: string, expiresAt: number): string {
  const mac = createHmac('sha256', secret()).update(`unlock|${scope}|${expiresAt}`).digest('base64url');
  return `${expiresAt}.${mac}`;
}

export function verifyUnlock(value: string | undefined, scope: string, now = Date.now()): boolean {
  if (!value) return false;
  const [exp, mac] = value.split('.');
  const expiresAt = Number(exp);
  if (!mac || !Number.isFinite(expiresAt) || expiresAt <= now) return false;
  const expected = createHmac('sha256', secret()).update(`unlock|${scope}|${expiresAt}`).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
