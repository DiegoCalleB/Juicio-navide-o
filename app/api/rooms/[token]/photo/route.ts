import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fail, guarded, json } from '@/lib/http';
import { MAX_PHOTO_BYTES, REPLY_DELAYS, type ReplyDelay } from '@/lib/royal';
import { scheduledAtSchema } from '@/lib/schemas';
import { sanitizeText } from '@/lib/sanitize';
import { addPhoto, findRoomByToken, normalizeImageType } from '@/services/rooms';

export const dynamic = 'force-dynamic';

const captionSchema = z.string().max(600).transform(sanitizeText).pipe(z.string().max(200));
const delaySchema = z.coerce.number().refine((n): n is ReplyDelay => (REPLY_DELAYS as readonly number[]).includes(n));

/** Foto del niño o de los padres (como el personaje). Siempre ya comprimida en el cliente. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('photo', { key: 'photo', max: 12, windowMs: 60_000, scope: token }, async () => {
    if (Number(req.headers.get('content-length') ?? '0') > MAX_PHOTO_BYTES + 64 * 1024) {
      return fail('TOO_LARGE', 'La foto es demasiado grande.', 413);
    }
    const found = await findRoomByToken(token);
    if (!found) return fail('NOT_FOUND', 'Sala no encontrada', 404);

    const form = await req.formData();
    const file = form.get('image');
    if (!(file instanceof Blob)) return fail('VALIDATION', 'Foto no válida.', 400);
    if (file.size === 0 || file.size > MAX_PHOTO_BYTES) return fail('TOO_LARGE', 'La foto es demasiado grande.', 413);
    if (!normalizeImageType(file.type)) return fail('VALIDATION', 'Formato de imagen no compatible.', 415);

    const caption = captionSchema.safeParse(form.get('caption') ?? '');
    const delay = delaySchema.safeParse(form.get('delayMinutes') ?? 0);
    const rawWhen = form.get('scheduledAt');
    const when = rawWhen ? scheduledAtSchema.safeParse(String(rawWhen)) : null;
    if (!caption.success || !delay.success || (when && !when.success)) return fail('VALIDATION', 'Datos no válidos (la fecha debe estar entre 1 minuto y 90 días).', 400);
    // Solo los padres pueden programar; el niño siempre entrega al momento.
    const scheduledAt = found.role === 'parent' && when?.success ? when.data : undefined;

    await addPhoto(found.room, found.role, Buffer.from(await file.arrayBuffer()), file.type, caption.data || null, delay.data, scheduledAt);
    return json({ ok: true, data: null }, 201);
  });
}
