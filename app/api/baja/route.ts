import type { NextRequest } from 'next/server';
import { readUnsubscribe } from '@/lib/contacts';
import { fail, guarded, json } from '@/lib/http';
import { getRoomStore } from '@/services/room-store';

export const dynamic = 'force-dynamic';

/**
 * Baja: borra el correo por completo. Vale desde el botón de /baja (JSON) y desde la baja con un clic de los
 * programas de correo (los datos van en la dirección). Siempre se pide con POST: abrir el enlace no borra nada.
 */
export async function POST(req: NextRequest) {
  return guarded('baja', { key: 'baja', max: 20, windowMs: 60_000 }, async () => {
    const q = req.nextUrl.searchParams;
    const body = (await req.json().catch(() => null)) as { e?: unknown; s?: unknown } | null;
    const e = typeof body?.e === 'string' ? body.e : q.get('e');
    const s = typeof body?.s === 'string' ? body.s : q.get('s');
    const email = readUnsubscribe(e, s);
    if (!email) return fail('VALIDATION', 'El enlace de baja no es válido.', 400);
    await getRoomStore().deleteContactsByEmail(email);
    return json({ ok: true, data: null });
  });
}
