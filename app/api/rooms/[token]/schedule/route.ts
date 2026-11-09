import type { NextRequest } from 'next/server';
import { fail, guarded, json } from '@/lib/http';
import { scheduleBatchSchema } from '@/lib/schemas';
import { findRoomByToken, scheduleMessages } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Programa varios mensajes del personaje de una vez (calendario de travesuras). Solo con el token de padres. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('schedule', { key: 'schedule', max: 6, windowMs: 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);
    const parsed = scheduleBatchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail('VALIDATION', 'Revisa las fechas y los textos (hasta 30 mensajes, de 1 minuto a 90 días).', 400);
    const outcome = await scheduleMessages(found.room, parsed.data.items);
    return json({ ok: true, data: outcome }, 201);
  });
}
