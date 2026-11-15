import { NextResponse } from 'next/server';
import { newChallenge } from '@/lib/adultGate';

export const dynamic = 'force-dynamic';

/** Una pregunta nueva (cuando se acaba el tiempo). */
export async function GET() {
  return NextResponse.json({ ok: true, data: await newChallenge() }, { headers: { 'Cache-Control': 'no-store' } });
}
