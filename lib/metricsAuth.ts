import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const METRICS_COOKIE = 'lm_metricas';

/** Clave del panel (variable de entorno METRICS_TOKEN, la pone el dueño en Railway). Sin ella, el panel no existe. */
export function metricsToken(): string | null {
  const t = process.env.METRICS_TOKEN;
  return t && t.length >= 12 ? t : null;
}

/** La cookie lleva su caducidad firmada con la clave del panel: si se filtra, deja de valer sola y cambiar METRICS_TOKEN la anula. */
const SESSION_MS = 7 * 24 * 60 * 60_000;
const sign = (token: string, exp: string) => createHmac('sha256', token).update(`metricas|${exp}`).digest('base64url');

export function tokenMatches(given: string): boolean {
  const t = metricsToken();
  if (!t) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function metricsCookieValue(now = Date.now()): string {
  const exp = String(now + SESSION_MS);
  return `${exp}.${sign(metricsToken() ?? '', exp)}`;
}

export function cookieValid(v: string | undefined, now = Date.now()): boolean {
  const t = metricsToken();
  if (!t || !v) return false;
  const [exp, mac] = v.split('.');
  if (!exp || !mac || !/^\d{10,16}$/.test(exp) || Number(exp) <= now) return false;
  const a = Buffer.from(mac);
  const b = Buffer.from(sign(t, exp));
  return a.length === b.length && timingSafeEqual(a, b);
}
