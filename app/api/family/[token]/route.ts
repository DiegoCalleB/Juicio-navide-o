import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fail, guarded, json } from '@/lib/http';
import { familyLockState } from '@/services/pin';
import { getFamily, renameFamily } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Comprueba que un enlace de familia existe (lo usa el móvil antes de guardarlo). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('family-check', { key: 'family-check', max: 30, windowMs: 60_000 }, async () => {
    // Con PIN, los nombres de los peques solo se dan con la familia desbloqueada.
    if ((await familyLockState(token)) !== 'open') return fail('NOT_FOUND', 'Familia no encontrada', 404);
    const family = await getFamily(token);
    if (!family) return fail('NOT_FOUND', 'Familia no encontrada', 404);
    // Los peques de la casa (solo nombre de pila y si ya leen) para el desplegable del formulario.
    const seen = new Set<string>();
    const kids = family.rooms.flatMap((r) => {
      const key = r.childName.trim().toLowerCase();
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ name: r.childName, reading: r.readingLevel }];
    });
    return json({ ok: true, data: { rooms: family.rooms.length, kids } });
  });
}

const bodySchema = z.object({ name: z.string().max(30).transform((s) => s.trim()) });

/** Cambia el apodo de la familia. Solo con el enlace de familia. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('family-rename', { key: 'family-rename', max: 10, windowMs: 60_000, scope: token }, async () => {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail('VALIDATION', 'Apodo no válido.', 400);
    if ((await familyLockState(token)) !== 'open') return fail('NOT_FOUND', 'Familia no encontrada', 404);
    const ok = await renameFamily(token, parsed.data.name || null);
    return ok ? json({ ok: true, data: null }) : fail('NOT_FOUND', 'Familia no encontrada', 404);
  });
}
