import type { NextRequest } from 'next/server';
import { fail, json } from '@/lib/http';
import { sessionFromWebhookObject, verifyWebhookSignature } from '@/lib/stripe';
import { fulfillCheckout } from '@/services/passes';

export const dynamic = 'force-dynamic';

/**
 * Webhook de Stripe: si los padres cierran la pestaña antes de volver, el pago se aplica igual.
 * Idempotente (por id de sesión). Configurar en Stripe el evento `checkout.session.completed`
 * (y `checkout.session.async_payment_succeeded` si se activan métodos de pago diferidos).
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get('stripe-signature'))) return fail('UNAUTHORIZED', 'Firma no válida', 400);
  try {
    const event = JSON.parse(raw) as { type?: string; data?: { object?: unknown } };
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = sessionFromWebhookObject(event.data?.object);
      if (session) await fulfillCheckout(session);
    }
    return json({ received: true });
  } catch (err) {
    console.error('[stripe webhook]', err instanceof Error ? err.message : err);
    // 500 → Stripe lo reintenta más tarde.
    return fail('UNKNOWN', 'Error al procesar', 500);
  }
}
