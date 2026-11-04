import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fail, guarded, json } from '@/lib/http';
import { CHILD_AUDIO_ENABLED } from '@/lib/features';
import { MAX_VOICE_BYTES, MAX_VOICE_SECONDS } from '@/lib/royal';
import { addChildVoice, findRoomByToken, normalizeAudioType } from '@/services/rooms';

export const dynamic = 'force-dynamic';

const durationSchema = z.coerce.number().min(0.8).max(MAX_VOICE_SECONDS + 2);

/** Nota de voz del niño. Solo con el token del niño. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('voice', { key: 'voice', max: 12, windowMs: 60_000, scope: token }, async () => {
    if (!CHILD_AUDIO_ENABLED) return fail('DISABLED', 'Los audios aún no están disponibles.', 403);
    const length = Number(req.headers.get('content-length') ?? '0');
    if (length > MAX_VOICE_BYTES + 64 * 1024) return fail('TOO_LARGE', 'La nota de voz es demasiado larga.', 413);

    const found = await findRoomByToken(token);
    if (!found || found.role !== 'child') return fail('NOT_FOUND', 'Sala no encontrada', 404);

    const form = await req.formData();
    const file = form.get('audio');
    const duration = durationSchema.safeParse(form.get('duration'));
    if (!(file instanceof Blob) || !duration.success) return fail('VALIDATION', 'Nota de voz no válida.', 400);
    if (file.size === 0 || file.size > MAX_VOICE_BYTES) return fail('TOO_LARGE', 'La nota de voz es demasiado larga.', 413);
    if (!normalizeAudioType(file.type)) return fail('VALIDATION', 'Formato de audio no compatible.', 415);

    await addChildVoice(found.room, Buffer.from(await file.arrayBuffer()), file.type, Math.round(duration.data * 10) / 10);
    return json({ ok: true, data: null }, 201);
  });
}
