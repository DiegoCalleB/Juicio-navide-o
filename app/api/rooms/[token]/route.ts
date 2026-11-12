import type { NextRequest } from 'next/server';
import { fail, guarded, json } from '@/lib/http';
import { isCharacterId } from '@/lib/characters';
import { roomEditSchema } from '@/lib/schemas';
import { editRoom, eraseRoom, findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Los padres cambian el nombre o el personaje de la sala. Solo con el token de padres. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('room-edit', { key: 'room-edit', max: 20, windowMs: 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);
    const parsed = roomEditSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail('VALIDATION', parsed.error.issues[0]?.message ?? 'Datos no válidos.', 400);
    const { childName, characterId, characterAlias, characterGender, readingLevel } = parsed.data;
    const patch = {
      childName,
      characterId: characterId && isCharacterId(characterId) ? characterId : undefined,
      characterAlias,
      characterGender,
      readingLevel,
    };
    const ok = await editRoom(found.room, patch);
    return ok ? json({ ok: true, data: null }) : fail('NOT_FOUND', 'Sala no encontrada', 404);
  });
}

/** Los padres borran la sala entera (mensajes, audios y fotos). Es irreversible. Solo con el token de padres. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('room-erase', { key: 'room-erase', max: 10, windowMs: 60_000, scope: token }, async () => {
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);
    await eraseRoom(found.room);
    return json({ ok: true, data: null });
  });
}
