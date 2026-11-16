import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ADULT_AGE, AGE_COOKIE, ageCookie, ageStatus, newAgeToken } from '@/lib/adultGate';

export const dynamic = 'force-dynamic';

const res = (status: number, body: unknown) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * Chispa pregunta la edad. No se guarda el número: solo una cookie firmada que dice «mayor» o «menor».
 * Quien dice ser menor queda sin acceso en ese dispositivo y no puede volver a contestar.
 */
export async function POST(req: NextRequest) {
  const prev = await ageStatus(req.cookies.get(AGE_COOKIE)?.value);
  if (prev === 'menor') return res(200, { ok: true, data: { adult: false } });

  const body = (await req.json().catch(() => null)) as { age?: unknown } | null;
  const raw = typeof body?.age === 'string' || typeof body?.age === 'number' ? String(body.age).trim() : '';
  const age = /^\d{1,3}$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isFinite(age) || age < 1 || age > 120) {
    return res(400, { ok: false, error: { code: 'INVALID', message: 'Mmm… ¿seguro? Escríbelo otra vez, con números.' } });
  }
  const adult = age >= ADULT_AGE;
  const r = res(200, { ok: true, data: { adult } });
  r.cookies.set(ageCookie(await newAgeToken(adult ? 'ok' : 'menor')));
  return r;
}
