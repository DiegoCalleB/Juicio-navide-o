import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { checkAnswer, newChallenge, newSession, safeNext, sessionCookie } from '@/lib/adultGate';
import { DEVICE, NETWORK, clearFails, humanWait, lockedFor, recordFail } from '@/lib/gateLock';
import { getClientFingerprint, getClientNetwork } from '@/lib/security';

export const dynamic = 'force-dynamic';

const res = (status: number, body: unknown) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const locked = (ms: number) =>
  res(429, { ok: false, error: { code: 'LOCKED', message: `Demasiados intentos. Vuelve a probar dentro de ${humanWait(ms)}.` } });

/**
 * Comprueba la respuesta de la puerta. Si es correcta, abre la zona de mayores en este navegador.
 * Los fallos se cuentan por dispositivo (3 seguidos) y por red (9), y cada bloqueo es más largo (15 min, 1 h, 24 h).
 */
export async function POST(req: NextRequest) {
  const device = `d:${await getClientFingerprint()}`;
  const network = `n:${await getClientNetwork()}`;
  const wait = Math.max(lockedFor(device), lockedFor(network));
  if (wait > 0) return locked(wait);

  const body = (await req.json().catch(() => null)) as { token?: unknown; answer?: unknown; next?: unknown } | null;
  const token = typeof body?.token === 'string' ? body.token.slice(0, 200) : '';
  const answer = typeof body?.answer === 'string' ? body.answer.slice(0, 10) : '';
  const result = token ? await checkAnswer(token, answer) : 'wrong';

  if (result === 'ok') {
    clearFails(device);
    const r = res(200, { ok: true, data: { next: safeNext(typeof body?.next === 'string' ? body.next : null) } });
    r.cookies.set(sessionCookie(await newSession()));
    return r;
  }
  if (result === 'expired') {
    return res(400, { ok: false, error: { code: 'EXPIRED', message: 'Se ha acabado el tiempo. Aquí tienes otra.' }, data: await newChallenge() });
  }
  const lock = Math.max(recordFail(device, DEVICE), recordFail(network, NETWORK));
  if (lock > 0) return locked(lock);
  return res(400, { ok: false, error: { code: 'WRONG', message: 'No es correcto. Prueba con esta otra.' }, data: await newChallenge() });
}
