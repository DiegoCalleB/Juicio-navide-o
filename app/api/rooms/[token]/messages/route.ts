import type { NextRequest } from 'next/server';
import { fail, guarded, json } from '@/lib/http';
import { findRoomByToken, listMessages } from '@/services/rooms';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('messages', { key: 'poll', max: 40, windowMs: 60_000 }, async () => {
    const found = await findRoomByToken(token);
    if (!found) return fail('NOT_FOUND', 'Sala no encontrada', 404);
    const messages = await listMessages(found.room, found.role);
    return json({ ok: true, data: { messages } });
  });
}
