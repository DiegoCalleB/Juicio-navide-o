import type { NextRequest } from 'next/server';
import { fail, guarded, json } from '@/lib/http';
import { kingReplySchema } from '@/lib/schemas';
import { addKingReply, findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Respuesta del Rey (escrita por el Paje Real → voz del Rey). Solo con el token de padres. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('reply', { key: 'reply', max: 10, windowMs: 60_000 }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);

    const parsed = kingReplySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return fail('VALIDATION', parsed.error.flatten().fieldErrors.text?.[0] ?? 'Mensaje no válido.', 400);
    }
    await addKingReply(found.room, parsed.data.text, parsed.data.delayMinutes, parsed.data.mode);
    return json({ ok: true, data: null }, 201);
  });
}
