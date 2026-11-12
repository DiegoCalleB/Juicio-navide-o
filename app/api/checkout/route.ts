import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { currentPrice, paymentsEnabled } from '@/lib/billing';
import { fail, guarded, json } from '@/lib/http';
import { originFromHeaders } from '@/lib/site';
import { createCheckoutSession } from '@/lib/stripe';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  /** Token de padres de la sala a desbloquear (opcional: también se puede comprar el pase sin sala). */
  roomToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/).optional(),
  /** Renuncia expresa al desistimiento (contenido digital que se activa al momento). */
  waiver: z.literal(true),
});

/**
 * Crea la sesión de Stripe Checkout del Pase de Navidad. Solo desde el panel de los padres o la portada,
 * nunca desde la pantalla del niño. A Stripe solo se le pasa el id interno de la sala, nunca un enlace secreto.
 */
export async function POST(req: NextRequest) {
  return guarded('checkout', { key: 'checkout', max: 10, windowMs: 60_000 }, async () => {
    if (!paymentsEnabled()) return fail('NOT_FOUND', 'Los pagos no están activos.', 404);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail('VALIDATION', 'Marca la casilla para continuar.', 400);

    let roomId: string | undefined;
    if (parsed.data.roomToken) {
      const found = await findRoomByToken(parsed.data.roomToken);
      if (!found || found.role !== 'parent') return fail('NOT_FOUND', 'Sala no encontrada', 404);
      roomId = found.room.id;
    }
    const origin = originFromHeaders(await headers());
    const price = currentPrice();
    const session = await createCheckoutSession({
      amountCents: price.cents,
      successUrl: `${origin}/pase/listo?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: parsed.data.roomToken ? `${origin}/paje/${parsed.data.roomToken}` : `${origin}/`,
      metadata: { ...(roomId ? { room_id: roomId } : {}), waiver: 'accepted', price_cents: String(price.cents) },
    });
    if (!session.url) return fail('UNKNOWN', 'No se pudo abrir el pago.', 502);
    return json({ ok: true, data: { url: session.url } });
  });
}
