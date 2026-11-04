import type { NextRequest } from 'next/server';
import { fail, guarded, json } from '@/lib/http';
import { findRoomByToken, getMessagesVersion, listMessages } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/**
 * Mensajes de la sala. Sondeo condicional: si el cliente manda la `v` que recibió y
 * nada ha cambiado, responde barato ("unchanged") sin listar ni firmar archivos.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('messages', { key: 'poll', max: 120, windowMs: 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found) return fail('NOT_FOUND', 'Sala no encontrada', 404);

    const version = await getMessagesVersion(found.room, found.role);
    if (req.nextUrl.searchParams.get('v') === version) return json({ ok: true, data: { version, unchanged: true } });

    const messages = await listMessages(found.room, found.role);
    return json({ ok: true, data: { version, messages } });
  });
}
