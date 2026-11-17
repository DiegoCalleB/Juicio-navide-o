import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const METRICS_COOKIE = 'lm_metricas';

/** Clave del panel (variable de entorno METRICS_TOKEN, la pone el dueño en Railway). Sin ella, el panel no existe. */
export function metricsToken(): string | null {
  const t = process.env.METRICS_TOKEN;
  return t && t.length >= 12 ? t : null;
}

const sign = (token: string) => createHmac('sha256', 'metricas-panel').update(token).digest('base64url');

export function tokenMatches(given: string): boolean {
  const t = metricsToken();
  if (!t) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function metricsCookieValue(): string {
  return sign(metricsToken() ?? '');
}

export function cookieValid(v: string | undefined): boolean {
  const t = metricsToken();
  if (!t || !v) return false;
  const a = Buffer.from(v);
  const b = Buffer.from(sign(t));
  return a.length === b.length && timingSafeEqual(a, b);
}
