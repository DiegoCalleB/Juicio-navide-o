import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { AssistantError, assistantDailyLimit, assistantEnabled, rewriteMessage, suggestMessages } from '@/lib/assistant';
import { fail, guarded, json } from '@/lib/http';
import { sanitizeText } from '@/lib/sanitize';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

const ideaSchema = z.string().max(600).transform(sanitizeText).pipe(z.string().min(3, 'Cuéntame un poco más.').max(300));

/** Tope global diario (en memoria del servidor): protege el gasto aunque se reparta entre muchas salas. */
const daily = (): { day: string; n: number } => {
  const g = globalThis as unknown as { __assistantDaily?: { day: string; n: number } };
  const day = new Date().toISOString().slice(0, 10);
  if (!g.__assistantDaily || g.__assistantDaily.day !== day) g.__assistantDaily = { day, n: 0 };
  return g.__assistantDaily;
};

/** «Ayúdame a escribirlo» (3 propuestas) y «Mejorar con magia» (mode: 'rewrite', 1 versión). Solo padres. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('suggest', { key: 'suggest', max: 12, windowMs: 10 * 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Enlace no encontrado', 404);
    if (!assistantEnabled()) return fail('UNAVAILABLE', 'El ayudante no está disponible ahora mismo.', 503);
    const body = (await req.json().catch(() => null)) as { idea?: unknown; mode?: unknown } | null;
    const rewrite = body?.mode === 'rewrite';
    const idea = ideaSchema.safeParse(body?.idea ?? '');
    if (!idea.success) return fail('VALIDATION', idea.error.issues[0]?.message ?? 'Idea no válida.', 400);
    const counter = daily();
    if (counter.n >= assistantDailyLimit()) return fail('LIMIT', 'El ayudante ha llegado a su límite de hoy. Mañana vuelve a estar disponible.', 429);
    counter.n++;
    const room = found.room;
    try {
      const input = { character: room.character, elfName: room.characterAlias, elfFemale: room.characterGender === 'f', readingLevel: room.readingLevel, idea: idea.data };
      const suggestions = rewrite ? [await rewriteMessage(input)] : await suggestMessages(input);
      return json({ ok: true, data: { suggestions } });
    } catch (err) {
      console.error('[assistant]', err instanceof AssistantError ? err.message : err);
      return fail('UNAVAILABLE', 'No he podido proponer mensajes ahora. Inténtalo de nuevo en un momento.', 502);
    }
  });
}
