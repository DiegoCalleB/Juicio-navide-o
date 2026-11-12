import type { NextRequest } from 'next/server';
import { fail, guarded, json } from '@/lib/http';
import { checkPass } from '@/services/passes';

export const dynamic = 'force-dynamic';

/** Comprueba un enlace de pase (propio o regalado) antes de guardarlo en el móvil. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('pass-check', { key: 'pass-check', max: 30, windowMs: 60_000 }, async () => {
    const res = await checkPass(token);
    if (res.state === 'not_found') return fail('NOT_FOUND', 'Este pase no existe.', 404);
    return json({ ok: true, data: { state: res.state, expiresAt: res.pass?.expiresAt ?? null, roomsLeft: res.roomsLeft ?? 0 } });
  });
}
