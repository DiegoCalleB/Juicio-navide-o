import type { NextRequest } from 'next/server';
import { fail, guarded, json } from '@/lib/http';
import { KING_VOICE_ENABLED } from '@/lib/features';
import { findRoomByToken, greetingAudioUrl } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Saludo con el nombre del niño ("¡Hola, Lucía!"), generado la primera vez. Solo con el token del niño. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('greeting', { key: 'greeting', max: 6, windowMs: 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'child') return fail('NOT_FOUND', 'Sala no encontrada', 404);
    const room = found.room;
    // La elfa usa la voz del elfo (de chico): sin saludo hablado antes que con una voz que no le pega.
    const speak = KING_VOICE_ENABLED && !(room.character === 'duende_chispa' && room.characterGender === 'f');
    const url = speak ? await greetingAudioUrl(room) : null;
    return json({ ok: true, data: { speak, url, character: room.character } });
  });
}
