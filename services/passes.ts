import 'server-only';
import { derivePassTokens, passExpiresAt, paymentsEnabled } from '@/lib/billing';
import { mailEnabled, sendMail } from '@/lib/mail';
import { passMail } from '@/lib/mailTemplates';
import { secEvent } from '@/lib/securityLog';
import { getSiteUrl } from '@/lib/site';
import type { CheckoutSession } from '@/lib/stripe';
import { hashToken, TOKEN_REGEX } from '@/lib/tokens';
import { publishRefresh } from '@/services/realtime';
import { getRoomStore } from '@/services/room-store';
import type { PassRecord } from '@/services/room-store/types';

export type PassState = 'ok' | 'expired' | 'full' | 'not_found';

/** Comprueba un enlace de pase: existe, no ha caducado y le quedan salas. */
export async function checkPass(token: string | null | undefined): Promise<{ state: PassState; pass?: PassRecord; roomsLeft?: number }> {
  if (!token || !TOKEN_REGEX.test(token)) return { state: 'not_found' };
  const store = getRoomStore();
  const pass = await store.findPassByTokenHash(hashToken(token));
  if (!pass) return { state: 'not_found' };
  if (Date.parse(pass.expiresAt) <= Date.now()) return { state: 'expired', pass };
  const used = await store.countRoomsByPass(pass.id);
  if (used >= pass.roomsLimit) return { state: 'full', pass, roomsLeft: 0 };
  return { state: 'ok', pass, roomsLeft: pass.roomsLimit - used };
}

/** ¿Sigue vigente un pase conocido por su id (el de la familia)? */
export async function checkPassById(id: string): Promise<boolean> {
  const store = getRoomStore();
  const pass = await store.findPassById(id);
  if (!pass || Date.parse(pass.expiresAt) <= Date.now()) return false;
  return (await store.countRoomsByPass(id)) < pass.roomsLimit;
}

/**
 * Da por bueno un pago de Stripe: crea el pase (idempotente, por id de sesión) y
 * desbloqueal portal desde la que se pagó. Lo llaman el webhook y la página de pago completado.
 */
export async function fulfillCheckout(session: CheckoutSession): Promise<{ passToken: string } | null> {
  if (!session.paid) return null;
  const store = getRoomStore();
  const tokens = derivePassTokens(session.id);
  const expiresAt = passExpiresAt().toISOString();
  const alreadyDone = !!(await store.findPassByStripeSession(session.id));
  const pass = await store.insertPass({
    tokenHash: hashToken(tokens.pass),
    kind: 'paid',
    stripeSessionId: session.id,
    stripePaymentIntent: session.paymentIntent,
    amountCents: session.amountTotal,
    expiresAt,
  });
  // Primera vez que se da por bueno este pago: se le manda el pase al correo que puso en Stripe (no se guarda).
  if (!alreadyDone && session.email && mailEnabled()) {
    const origin = getSiteUrl();
    const mail = passMail(`${origin}/?pase=${tokens.pass}`);
    void sendMail({ to: session.email, ...mail, idempotencyKey: `pase-${session.id}` }).catch(() => {});
  }
  const roomId = session.metadata.room_id;
  if (roomId && /^[0-9a-f-]{36}$/.test(roomId)) {
    if (await store.attachPass(roomId, pass.id)) publishRefresh(roomId);
  }
  return { passToken: tokens.pass };
}

/**
 * Reembolso total o disputa en Stripe: se retira el pase (y los regalos que ya salieran de él) y las salas vuelven a la prueba ya terminada.
 * Devuelve false si ese pago no corresponde a ningún pase (pagos anteriores a guardar el identificador).
 */
export async function revokeByPaymentIntent(paymentIntent: string, reason: 'reembolso' | 'disputa'): Promise<boolean> {
  const store = getRoomStore();
  const pass = await store.findPassByPaymentIntent(paymentIntent);
  if (!pass) {
    secEvent('pase_no_encontrado', { motivo: reason });
    return false;
  }
  const rooms = await store.revokePass(pass.id, new Date().toISOString());
  secEvent('pase_retirado', { motivo: reason, salas: rooms });
  return true;
}

/** Desbloquea un portal con un pase que ya se tiene (propio o regalado). */
export async function usePassOnRoom(roomId: string, token: string): Promise<PassState> {
  const res = await checkPass(token);
  if (res.state !== 'ok' || !res.pass) return res.state;
  await getRoomStore().attachPass(roomId, res.pass.id);
  publishRefresh(roomId);
  return 'ok';
}

export { paymentsEnabled };
