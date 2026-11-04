import type { NextRequest } from 'next/server';
import { fail, guarded, json } from '@/lib/http';
import { findRoomByToken, signalTyping } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Aviso efímero de "escribiendo…" hacia el otro lado. No guarda nada. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('typing', { key: 'typing', max: 60, windowMs: 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found) return fail('NOT_FOUND', 'Sala no encontrada', 404);
    signalTyping(found.room, found.role);
    return json({ ok: true, data: null });
  });
}
