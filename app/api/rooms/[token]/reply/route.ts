import type { NextRequest } from 'next/server';
import { fail, guarded, json } from '@/lib/http';
import { kingReplySchema } from '@/lib/schemas';
import { addKingReply, findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Respuesta del Rey (escrita por el Paje Real → voz del Rey). Solo con el token de padres. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('reply', { key: 'reply', max: 20, windowMs: 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);

    const parsed = kingReplySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return fail('VALIDATION', parsed.error.flatten().fieldErrors.text?.[0] ?? parsed.error.flatten().fieldErrors.scheduledAt?.[0] ?? 'Mensaje no válido.', 400);
    }
    const outcome = await addKingReply(found.room, parsed.data.text, parsed.data.delayMinutes, parsed.data.mode, parsed.data.surprise ? 'surprise' : undefined, parsed.data.scheduledAt);
    return json({ ok: true, data: outcome }, 201);
  });
}
