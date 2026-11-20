import { NextResponse } from 'next/server';
import { GATE_COOKIE } from '@/lib/adultGate';

export const dynamic = 'force-dynamic';

/** Cierra la zona de mayores en este navegador. */
export async function POST() {
  const r = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  r.cookies.set({ name: GATE_COOKIE, value: '', path: '/', maxAge: 0 });
  return r;
}
