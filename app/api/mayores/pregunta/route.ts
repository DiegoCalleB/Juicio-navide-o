import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AGE_COOKIE, ageStatus, newChallenge } from '@/lib/adultGate';

export const dynamic = 'force-dynamic';

/** Una pregunta nueva (cuando se acaba el tiempo). Solo para quien ya contestó a Chispa. */
export async function GET(req: NextRequest) {
  if ((await ageStatus(req.cookies.get(AGE_COOKIE)?.value)) !== 'ok') {
    return NextResponse.json({ ok: false, error: { code: 'AGE', message: 'No se puede continuar.' } }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json({ ok: true, data: await newChallenge() }, { headers: { 'Cache-Control': 'no-store' } });
}
