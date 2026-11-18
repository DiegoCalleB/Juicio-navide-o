import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/** Versión del texto de consentimiento de novedades (se guarda con el «sí»; subirla si cambia el texto). */
export const CONSENT_VERSION = '2026-11';

const secret = () => {
  const s = process.env.PASS_SECRET || process.env.FINGERPRINT_SALT;
  if (!s || s.length < 16) throw new Error('Falta PASS_SECRET (o FINGERPRINT_SALT) para los enlaces de baja.');
  return s;
};

const sig = (email: string) => createHmac('sha256', secret()).update(`baja|${email}`).digest('base64url');

export function unsubscribeUrl(origin: string, email: string): string {
  return `${origin}/baja?e=${Buffer.from(email).toString('base64url')}&s=${sig(email)}`;
}

/** Devuelve el correo si el enlace de baja es auténtico. */
export function readUnsubscribe(e: string | null | undefined, s: string | null | undefined): string | null {
  if (!e || !s || e.length > 200 || s.length > 100) return null;
  try {
    const email = Buffer.from(e, 'base64url').toString('utf8');
    const a = Buffer.from(s);
    const b = Buffer.from(sig(email));
    return a.length === b.length && timingSafeEqual(a, b) ? email : null;
  } catch {
    return null;
  }
}
