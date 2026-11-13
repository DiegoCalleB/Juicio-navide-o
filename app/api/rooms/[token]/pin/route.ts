import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fail, guarded, json } from '@/lib/http';
import { PIN_REGEX } from '@/lib/pin';
import { lockNow, recoverPin, removePin, resolveByToken, setPin, type PinOutcome } from '@/services/pin';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('set'), pin: z.string().regex(PIN_REGEX, 'El PIN tiene de 4 a 6 cifras.') }),
  z.object({ action: z.literal('remove'), pin: z.string().max(12) }),
  z.object({ action: z.literal('lock') }),
  z.object({ action: z.literal('recover'), code: z.string().max(40) }),
]);

const reply = (out: PinOutcome) => {
  if (out.ok) return json({ ok: true, data: { recovery: out.recovery ?? null } });
  const status = out.code === 'LOCKED' ? 429 : out.code === 'NOT_FOUND' ? 404 : 400;
  return json({ ok: false, error: { code: out.code, message: out.message, left: out.left ?? null, minutes: out.minutes ?? null } }, status);
};

/**
 * Bloqueo parental de la sala (y de su familia): poner o cambiar el PIN, quitarlo, bloquear ya, o recuperar con el código de rescate.
 * Solo con el enlace de padres (el del niño da 404). Poner o cambiar el PIN exige tener el panel desbloqueado.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return guarded('pin', { key: 'pin', max: 20, windowMs: 60_000, scope: token }, async () => {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail('VALIDATION', parsed.error.issues[0]?.message ?? 'Datos no válidos.', 400);
    const body = parsed.data;

    if (body.action === 'recover') {
      // Vale el enlace de padres o el de familia; el del niño no.
      if (!(await resolveByToken(token))) return fail('NOT_FOUND', 'Sala no encontrada', 404);
      return reply(await recoverPin(token, body.code));
    }
    if (body.action === 'lock') {
      // Vale el enlace de padres o el de familia.
      if (!(await resolveByToken(token))) return fail('NOT_FOUND', 'Sala no encontrada', 404);
      await lockNow(token);
      return json({ ok: true, data: null });
    }
    // El resto exige que el panel esté abierto (si tiene PIN, desbloqueado) y que sea el enlace de padres.
    const found = await findRoomByToken(token);
    if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);
    if (body.action === 'set') return reply(await setPin(token, body.pin));
    return reply(await removePin(token, body.pin));
  });
}
