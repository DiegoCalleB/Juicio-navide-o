import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { clientIp } from '@/lib/clientIp';
import { METRICS_COOKIE, metricsCookieValue, metricsToken, tokenMatches } from '@/lib/metricsAuth';
import { rateLimit } from '@/lib/security';
import { secEvent } from '@/lib/securityLog';

export const dynamic = 'force-dynamic';

const res = (status: number, body: unknown) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** Entrada al panel de métricas con la clave del dueño. Sin METRICS_TOKEN configurado, no existe. */
export async function POST(req: NextRequest) {
  if (!metricsToken()) return res(404, { ok: false });
  const ip = clientIp(req.headers);
  if (!rateLimit(`metricas:${ip}`, 8, 10 * 60_000)) {
    secEvent('metricas_limite');
    return res(429, { ok: false, error: 'Demasiados intentos.' });
  }
  const body = (await req.json().catch(() => null)) as { token?: unknown } | null;
  const given = typeof body?.token === 'string' ? body.token.slice(0, 200) : '';
  if (!tokenMatches(given)) {
    secEvent('metricas_clave_incorrecta');
    return res(401, { ok: false, error: 'Clave incorrecta.' });
  }
  const r = res(200, { ok: true });
  r.cookies.set({ name: METRICS_COOKIE, value: metricsCookieValue(), httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return r;
}

/** Cerrar sesión del panel. */
export async function DELETE() {
  const r = res(200, { ok: true });
  r.cookies.set({ name: METRICS_COOKIE, value: '', path: '/', maxAge: 0 });
  return r;
}
