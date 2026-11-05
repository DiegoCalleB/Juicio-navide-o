import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fail, guarded, json } from '@/lib/http';
import { eraseMessage, findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Los padres borran un mensaje (por ejemplo, un error). Solo con el token de padres. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;
  return guarded('erase', { key: 'erase', max: 60, windowMs: 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);
    if (!z.string().uuid().safeParse(id).success) return fail('VALIDATION', 'Mensaje no válido.', 400);
    const ok = await eraseMessage(found.room, id);
    return ok ? json({ ok: true, data: null }) : fail('NOT_FOUND', 'Ese mensaje ya no existe.', 404);
  });
}
