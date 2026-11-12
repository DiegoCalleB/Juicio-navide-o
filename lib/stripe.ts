import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { isStripeFake } from '@/lib/billing';

/**
 * Cliente mínimo de Stripe Checkout (sin dependencias): crear la sesión de pago, consultarla
 * y verificar la firma del webhook. Con STRIPE_FAKE=1 (solo pruebas con almacén en memoria)
 * simula un pago completado sin salir de la app.
 */

export interface CheckoutSession {
  id: string;
  url: string | null;
  paid: boolean;
  amountTotal: number | null;
  metadata: Record<string, string>;
}

interface StripeSessionJson {
  id: string;
  url: string | null;
  payment_status: string;
  status: string;
  amount_total: number | null;
  metadata: Record<string, string> | null;
}

const g = globalThis as unknown as { __fakeStripe?: Map<string, CheckoutSession> };
const fakeSessions = () => (g.__fakeStripe ??= new Map());

const toSession = (s: StripeSessionJson): CheckoutSession => ({
  id: s.id,
  url: s.url,
  paid: s.payment_status === 'paid' || s.payment_status === 'no_payment_required',
  amountTotal: s.amount_total,
  metadata: s.metadata ?? {},
});

function secretKey(): string {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k || !k.startsWith('sk_')) throw new Error('Falta STRIPE_SECRET_KEY.');
  return k;
}

async function stripeFetch(path: string, init: { method: 'GET' | 'POST'; form?: URLSearchParams }): Promise<StripeSessionJson> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      ...(init.form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: init.form?.toString(),
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => null)) as (StripeSessionJson & { error?: { message?: string } }) | null;
  if (!res.ok || !body) throw new Error(`Stripe ${res.status}: ${body?.error?.message ?? 'sin respuesta'}`);
  return body;
}

export async function createCheckoutSession(opts: {
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<CheckoutSession> {
  if (isStripeFake()) {
    const id = `cs_fake_${randomBytes(12).toString('hex')}`;
    const s: CheckoutSession = { id, url: opts.successUrl.replace('{CHECKOUT_SESSION_ID}', id), paid: true, amountTotal: opts.amountCents, metadata: opts.metadata };
    fakeSessions().set(id, s);
    return s;
  }
  const f = new URLSearchParams();
  f.set('mode', 'payment');
  f.set('locale', 'es');
  f.set('success_url', opts.successUrl);
  f.set('cancel_url', opts.cancelUrl);
  f.set('line_items[0][quantity]', '1');
  f.set('line_items[0][price_data][currency]', 'eur');
  f.set('line_items[0][price_data][unit_amount]', String(opts.amountCents));
  f.set('line_items[0][price_data][product_data][name]', 'Pase de Navidad · Mensajería Mágica');
  f.set(
    'line_items[0][price_data][product_data][description]',
    'Salas sin límite hasta el 20 de enero con Papá Noel, el elfo y los Reyes, para todos los hermanos. Incluye un pase para regalar.',
  );
  // Códigos promocionales creados en el panel de Stripe (p. ej. AMIGOS al 100 %).
  f.set('allow_promotion_codes', 'true');
  f.set('custom_text[submit][message]', 'El pase se activa al momento. Pago único: no es una suscripción.');
  for (const [k, v] of Object.entries(opts.metadata)) f.set(`metadata[${k}]`, v);
  return toSession(await stripeFetch('checkout/sessions', { method: 'POST', form: f }));
}

export async function retrieveCheckoutSession(id: string): Promise<CheckoutSession | null> {
  if (!/^cs_[A-Za-z0-9_]{8,200}$/.test(id)) return null;
  if (isStripeFake()) return fakeSessions().get(id) ?? null;
  try {
    return toSession(await stripeFetch(`checkout/sessions/${encodeURIComponent(id)}`, { method: 'GET' }));
  } catch (err) {
    console.error('[stripe retrieve]', err instanceof Error ? err.message : err);
    return null;
  }
}

/** Verifica la cabecera Stripe-Signature (HMAC-SHA256 de `${t}.${cuerpo}`, tolerancia de 5 min). */
export function verifyWebhookSignature(rawBody: string, header: string | null, now = Date.now()): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = header.split(',').map((p) => p.split('=') as [string, string]);
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || sigs.length === 0 || Math.abs(now / 1000 - Number(t)) > 300) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex'));
  return sigs.some((s) => {
    const b = Buffer.from(s);
    return b.length === expected.length && timingSafeEqual(b, expected);
  });
}

export function sessionFromWebhookObject(obj: unknown): CheckoutSession | null {
  const s = obj as StripeSessionJson | null;
  return s && typeof s.id === 'string' ? toSession(s) : null;
}
