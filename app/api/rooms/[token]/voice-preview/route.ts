import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { fail, guarded } from '@/lib/http';
import { kingReplySchema } from '@/lib/schemas';
import { findRoomByToken, previewVoice } from '@/services/rooms';

export const dynamic = 'force-dynamic';

const REASONS: Record<'trial' | 'limit' | 'unavailable' | 'empty', string> = {
  trial: 'Ya has usado los mensajes con voz de la prueba. Con el Pase, todos los mensajes pueden ir con voz.',
  limit: 'Se ha alcanzado el límite diario de voz. Puedes enviarlo por escrito.',
  unavailable: 'La voz no está disponible ahora mismo. Puedes enviarlo por escrito.',
  empty: 'Escribe algo que se pueda decir en voz alta.',
};

/** Escuchar antes de enviar: devuelve el audio con la voz del personaje. Solo padres. No envía nada. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('voice-preview', { key: 'voice-preview', max: 8, windowMs: 10 * 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);
    const body = (await req.json().catch(() => null)) as { text?: unknown } | null;
    const parsed = kingReplySchema.shape.text.safeParse(body?.text);
    if (!parsed.success) return fail('VALIDATION', 'Mensaje no válido.', 400);
    const out = await previewVoice(found.room, parsed.data);
    if (!out.ok) return fail(out.reason === 'empty' ? 'VALIDATION' : 'VOICE', REASONS[out.reason], out.reason === 'empty' ? 400 : 409);
    return new NextResponse(new Uint8Array(out.audio), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  });
}
