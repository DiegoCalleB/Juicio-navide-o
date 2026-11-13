import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fail, guarded, json } from '@/lib/http';
import { tryUnlock } from '@/services/pin';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/), pin: z.string().max(12) });

/** Poner el PIN para abrir el panel (con el enlace de padres) o la familia (con el de familia). Pone la cookie de desbloqueo. */
export async function POST(req: NextRequest) {
  return guarded('unlock', { key: 'unlock', max: 30, windowMs: 60_000 }, async () => {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail('VALIDATION', 'Datos no válidos.', 400);
    const out = await tryUnlock(parsed.data.token, parsed.data.pin);
    if (out.ok) return json({ ok: true, data: null });
    const status = out.code === 'LOCKED' ? 429 : out.code === 'NOT_FOUND' ? 404 : 400;
    return json({ ok: false, error: { code: out.code, message: out.message, left: out.left ?? null, minutes: out.minutes ?? null } }, status);
  });
}
