import type { NextRequest } from 'next/server';
import { fail, guarded, json } from '@/lib/http';
import { childTextSchema } from '@/lib/schemas';
import { addChildText, findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Mensaje escrito del niño. Solo con el token del niño. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('message', { key: 'message', max: 15, windowMs: 60_000 }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'child') return fail('NOT_FOUND', 'Sala no encontrada', 404);

    const parsed = childTextSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return fail('VALIDATION', parsed.error.flatten().fieldErrors.text?.[0] ?? 'Mensaje no válido.', 400);
    }
    await addChildText(found.room, parsed.data.text);
    return json({ ok: true, data: null }, 201);
  });
}
