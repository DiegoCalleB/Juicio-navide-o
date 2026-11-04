import type { NextRequest } from 'next/server';
import { fail, guarded, json } from '@/lib/http';
import { markOpened } from '@/services/realtime';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** El niño ha abierto el mensaje de entrada: aviso efímero a los padres. Solo con el token del niño. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('opened', { key: 'opened', max: 10, windowMs: 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'child') return fail('NOT_FOUND', 'Sala no encontrada', 404);
    markOpened(found.room.id);
    return json({ ok: true, data: null });
  });
}
