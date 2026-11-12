import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fail, guarded, json } from '@/lib/http';
import { usePassOnRoom } from '@/services/passes';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({ passToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/) });

const MESSAGES = {
  expired: 'Este pase ya ha caducado.',
  full: 'Este pase ya tiene todas sus salas.',
  not_found: 'Este pase no existe.',
} as const;

/** Desbloquea la sala con un pase que ya se tiene. Solo con el token de padres. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('room-pass', { key: 'room-pass', max: 10, windowMs: 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail('VALIDATION', 'Pase no válido.', 400);
    const state = await usePassOnRoom(found.room.id, parsed.data.passToken);
    if (state !== 'ok') return fail('PASS_' + state.toUpperCase(), MESSAGES[state], 400);
    return json({ ok: true, data: null });
  });
}
