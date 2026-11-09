import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fail, guarded, json } from '@/lib/http';
import { messageEditSchema } from '@/lib/schemas';
import { editMessage, findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Los padres corrigen el texto de un mensaje del personaje. Solo con el token de padres. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;
  return guarded('message-edit', { key: 'message-edit', max: 60, windowMs: 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);
    if (!z.string().uuid().safeParse(id).success) return fail('VALIDATION', 'Mensaje no válido.', 400);
    const parsed = messageEditSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail('VALIDATION', 'Escribe el mensaje corregido (hasta 300 caracteres).', 400);
    const outcome = await editMessage(found.room, id, parsed.data.text);
    if (outcome === 'invalid') return fail('VALIDATION', 'El mensaje no puede quedar vacío.', 400);
    if (outcome === 'not_found') return fail('NOT_FOUND', 'Ese mensaje ya no se puede editar.', 404);
    return json({ ok: true, data: null });
  });
}
