import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AGE_COOKIE, ageStatus, newSession, safeNext, sessionCookie } from '@/lib/adultGate';
import { track } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

/**
 * Entrada a la cuenta: solo hace falta que Chispa ya haya oído una edad de mayor (cookie firmada).
 * Abre la sesión y lleva a la página pedida (siempre una ruta interna). Quien dijo ser menor, o no ha contestado, no entra.
 */
export async function GET(req: NextRequest) {
  const age = await ageStatus(req.cookies.get(AGE_COOKIE)?.value);
  const dest = new URL(age === 'ok' ? safeNext(req.nextUrl.searchParams.get('next')) : '/mayores', req.nextUrl.origin);
  const r = NextResponse.redirect(dest);
  r.headers.set('Cache-Control', 'private, no-store');
  r.headers.set('Referrer-Policy', 'no-referrer');
  if (age === 'ok') {
    await track('puerta_ok', { src: 'web' });
    r.cookies.set(sessionCookie(await newSession()));
  }
  return r;
}
