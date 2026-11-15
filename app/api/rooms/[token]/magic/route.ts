import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { fail, guarded } from '@/lib/http';
import { MagicError, magicEnabled, magicLimits, makeMagicScene } from '@/lib/magicPhoto';
import { MAX_PHOTO_BYTES } from '@/lib/royal';
import { findRoomByToken, normalizeImageType, roomAccess } from '@/services/rooms';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Contadores del día en memoria del servidor: por sala y en total (protegen el gasto). */
function counters(): { day: string; total: number; rooms: Map<string, number> } {
  const g = globalThis as unknown as { __magic?: { day: string; total: number; rooms: Map<string, number> } };
  const day = new Date().toISOString().slice(0, 10);
  if (!g.__magic || g.__magic.day !== day) g.__magic = { day, total: 0, rooms: new Map() };
  return g.__magic;
}

const MSG = {
  person: 'Por privacidad, solo convertimos dibujos, cartas y juguetes. En esta foto parece que sale una persona, así que no la transformamos.',
  refused: 'No he podido crear la escena con esta imagen. Prueba con otro dibujo.',
  unavailable: 'La magia no está disponible ahora mismo. Inténtalo en un momento.',
};

/** «✨ Convertir en escena mágica»: devuelve la ilustración para que los padres la vean antes de enviarla. Solo padres. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('magic', { key: 'magic', max: 6, windowMs: 10 * 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);
    if (!magicEnabled()) return fail('UNAVAILABLE', MSG.unavailable, 503);
    const room = found.room;
    const access = roomAccess(room);
    if (access.locked) return fail('TRIAL_ENDED', 'La prueba ha terminado.', 403);

    const form = await req.formData();
    const file = form.get('image');
    if (!(file instanceof Blob) || file.size === 0 || file.size > MAX_PHOTO_BYTES) return fail('VALIDATION', 'Imagen no válida.', 400);
    const mime = normalizeImageType(file.type);
    if (!mime) return fail('VALIDATION', 'Formato de imagen no compatible.', 415);

    const lim = magicLimits();
    const c = counters();
    const used = c.rooms.get(room.id) ?? 0;
    const roomMax = access.plan === 'trial' ? lim.trialDaily : lim.roomDaily;
    if (used >= roomMax) {
      return fail('LIMIT', access.plan === 'trial' ? 'En la prueba gratis puedes crear 1 escena mágica al día. Con el Pase, hasta 5.' : `Hoy ya has creado ${roomMax} escenas mágicas. Mañana podrás crear más.`, 429);
    }
    if (c.total >= lim.globalDaily) return fail('LIMIT', 'La magia descansa por hoy. Mañana vuelve a estar disponible.', 429);
    c.rooms.set(room.id, used + 1);
    c.total++;

    try {
      const out = await makeMagicScene({ image: Buffer.from(await file.arrayBuffer()), mime, character: room.character, elfFemale: room.characterGender === 'f' });
      return new NextResponse(new Uint8Array(out), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store', 'X-Magic-Left': String(Math.max(0, roomMax - used - 1)) } });
    } catch (err) {
      // Si no se ha podido crear, no cuenta.
      c.rooms.set(room.id, used);
      c.total = Math.max(0, c.total - 1);
      const kind = err instanceof MagicError ? err.kind : 'unavailable';
      console.error('[magic]', err instanceof Error ? err.message : err);
      return fail(kind === 'person' ? 'PERSON' : 'UNAVAILABLE', MSG[kind], kind === 'person' ? 422 : 502);
    }
  });
}
