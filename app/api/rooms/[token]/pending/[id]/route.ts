import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fail, guarded, json } from '@/lib/http';
import { cancelPending, findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Cancela un mensaje programado que aún no se ha entregado. Solo con el token de padres. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;
  return guarded('pending', { key: 'pending', max: 40, windowMs: 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);
    if (!z.string().uuid().safeParse(id).success) return fail('VALIDATION', 'Mensaje no válido.', 400);
    const ok = await cancelPending(found.room, id);
    return ok ? json({ ok: true, data: null }) : fail('NOT_FOUND', 'Ese mensaje ya se ha entregado o no existe.', 404);
  });
}
