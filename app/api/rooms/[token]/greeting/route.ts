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
    if (!found || found.role !== 'child') return fail('NOT_FOUND', 'Enlace no encontrado', 404);
    const room = found.room;
    const speak = KING_VOICE_ENABLED;
    const url = speak ? await greetingAudioUrl(room) : null;
    // Audios fijos del saludo: la elfa tiene los suyos (voz de chica).
    const clip = room.character === 'duende_chispa' && room.characterGender === 'f' ? 'duende_chispa-f' : room.character;
    return json({ ok: true, data: { speak, url, character: room.character, clip } });
  });
}
