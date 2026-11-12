import type { NextRequest } from 'next/server';
import { fail, guarded, json } from '@/lib/http';
import { findRoomByToken, rotateChildLink } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Los padres cambian el enlace del niño (el anterior deja de funcionar). Solo con el token de padres. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('child-link', { key: 'child-link', max: 10, windowMs: 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);
    const childToken = await rotateChildLink(found.room, token);
    return json({ ok: true, data: { childPath: `/r/${childToken}` } });
  });
}
