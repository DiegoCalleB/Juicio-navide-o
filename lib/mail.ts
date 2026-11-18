import 'server-only';
import { isMemoryStore } from '@/services/room-store';

/**
 * Envío de correo con Resend (sin dependencias, como Stripe). Necesita RESEND_API_KEY (re_…) y MAIL_FROM
 * (p. ej. «Línea Mágica <hola@lineamagica.es>», con el dominio verificado en Resend). Sin ellas, el correo
 * queda apagado y la web lo oculta. Con MAIL_FAKE=1 (solo pruebas con almacén en memoria) se guarda en un buzón de pruebas.
 */
export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Evita duplicados si se repite la petición (24 h en Resend). */
  idempotencyKey?: string;
  /** Si es de novedades: baja con un clic (cabeceras List-Unsubscribe). */
  unsubscribeUrl?: string;
}

const g = globalThis as unknown as { __outbox?: Mail[] };
export const outbox = (): Mail[] => (g.__outbox ??= []);

const fake = () => process.env.MAIL_FAKE === '1' && isMemoryStore();

export function mailEnabled(): boolean {
  return fake() || (/^re_/.test(process.env.RESEND_API_KEY ?? '') && !!process.env.MAIL_FROM?.includes('@'));
}

/** Devuelve si se ha enviado. Nunca registra el destinatario. */
export async function sendMail(m: Mail): Promise<boolean> {
  if (fake()) {
    outbox().push(m);
    return true;
  }
  if (!mailEnabled()) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        ...(m.idempotencyKey ? { 'Idempotency-Key': m.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [m.to],
        subject: m.subject,
        html: m.html,
        text: m.text,
        ...(m.unsubscribeUrl ? { headers: { 'List-Unsubscribe': `<${m.unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
      }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) console.error('[mail]', `Resend respondió ${res.status}`);
    return res.ok;
  } catch (err) {
    console.error('[mail]', err instanceof Error ? err.name : 'error');
    return false;
  }
}
