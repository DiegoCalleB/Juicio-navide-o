import type { NextRequest } from 'next/server';
import { fail, json } from '@/lib/http';
import { secAlert } from '@/lib/securityAlert';
import { sessionFromWebhookObject, verifyWebhookSignature } from '@/lib/stripe';
import { fulfillCheckout, revokeByPaymentIntent } from '@/services/passes';

export const dynamic = 'force-dynamic';

/**
 * Webhook de Stripe: si los padres cierran la pestaña antes de volver, el pago se aplica igual.
 * Idempotente (por id de sesión). Configurar en Stripe los eventos `checkout.session.completed`
 * (y `checkout.session.async_payment_succeeded` si se activan métodos de pago diferidos) y, para retirar
 * el pase si se devuelve el dinero, `charge.refunded` y `charge.dispute.created`.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get('stripe-signature'))) {
    secAlert('stripe_firma_invalida');
    return fail('UNAUTHORIZED', 'Firma no válida', 400);
  }
  try {
    const event = JSON.parse(raw) as { type?: string; data?: { object?: unknown } };
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = sessionFromWebhookObject(event.data?.object);
      if (session) await fulfillCheckout(session);
    }
    // Reembolso total o disputa: se retira el pase (idempotente).
    const obj = event.data?.object as { payment_intent?: unknown; refunded?: unknown } | undefined;
    const pi = typeof obj?.payment_intent === 'string' ? obj.payment_intent : null;
    if (pi && event.type === 'charge.refunded' && obj?.refunded === true) await revokeByPaymentIntent(pi, 'reembolso');
    if (pi && event.type === 'charge.dispute.created') await revokeByPaymentIntent(pi, 'disputa');
    return json({ received: true });
  } catch (err) {
    console.error('[stripe webhook]', err instanceof Error ? err.message : err);
    // 500 → Stripe lo reintenta más tarde.
    return fail('UNKNOWN', 'Error al procesar', 500);
  }
}
