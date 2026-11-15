import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { checkAnswer, newChallenge, newSession, safeNext, sessionCookie } from '@/lib/adultGate';
import { getClientFingerprint } from '@/lib/security';

export const dynamic = 'force-dynamic';

const LOCK_FAILS = 3;
const LOCK_MS = 15 * 60_000;
/** Fallos por móvil/conexión (en memoria): 3 seguidos bloquean la puerta 15 min. */
function fails(): Map<string, { n: number; until: number }> {
  const g = globalThis as unknown as { __gateFails?: Map<string, { n: number; until: number }> };
  return (g.__gateFails ??= new Map());
}

const res = (status: number, body: unknown) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** Comprueba la respuesta de la puerta. Si es correcta, abre la zona de mayores en este navegador. */
export async function POST(req: NextRequest) {
  const fp = await getClientFingerprint();
  const map = fails();
  const now = Date.now();
  const f = map.get(fp);
  if (f && f.until > now) {
    return res(429, { ok: false, error: { code: 'LOCKED', message: `Demasiados intentos. Vuelve a probar dentro de ${Math.ceil((f.until - now) / 60_000)} minutos.` } });
  }
  const body = (await req.json().catch(() => null)) as { token?: unknown; answer?: unknown; next?: unknown } | null;
  const token = typeof body?.token === 'string' ? body.token.slice(0, 200) : '';
  const answer = typeof body?.answer === 'string' ? body.answer.slice(0, 10) : '';
  const result = token ? await checkAnswer(token, answer) : 'wrong';

  if (result === 'ok') {
    map.delete(fp);
    const r = res(200, { ok: true, data: { next: safeNext(typeof body?.next === 'string' ? body.next : null) } });
    r.cookies.set(sessionCookie(await newSession()));
    return r;
  }
  if (result === 'expired') {
    return res(400, { ok: false, error: { code: 'EXPIRED', message: 'Se ha acabado el tiempo. Aquí tienes otra.' }, data: await newChallenge() });
  }
  const n = (f && f.until <= now && f.n >= LOCK_FAILS ? 0 : f?.n ?? 0) + 1;
  map.set(fp, { n, until: n >= LOCK_FAILS ? now + LOCK_MS : 0 });
  if (map.size > 5000) for (const [k, v] of map) if (v.until && v.until < now) map.delete(k);
  if (n >= LOCK_FAILS) {
    return res(429, { ok: false, error: { code: 'LOCKED', message: 'Demasiados intentos. Vuelve a probar dentro de 15 minutos.' } });
  }
  return res(400, { ok: false, error: { code: 'WRONG', message: 'No es correcto. Prueba con esta otra.' }, data: await newChallenge() });
}
