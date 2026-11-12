import 'server-only';
import { derivePassTokens, passExpiresAt, paymentsEnabled } from '@/lib/billing';
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
 * Da por bueno un pago de Stripe: crea el pase y el de regalo (idempotente, por id de sesión) y
 * desbloquea la sala desde la que se pagó. Lo llaman el webhook y la página de pago completado.
 */
export async function fulfillCheckout(session: CheckoutSession): Promise<{ passToken: string; giftToken: string } | null> {
  if (!session.paid) return null;
  const store = getRoomStore();
  const tokens = derivePassTokens(session.id);
  const expiresAt = passExpiresAt().toISOString();
  const pass = await store.insertPass({
    tokenHash: hashToken(tokens.pass),
    kind: 'paid',
    stripeSessionId: session.id,
    amountCents: session.amountTotal,
    expiresAt,
  });
  if (!(await store.findGiftOf(pass.id))) {
    await store.insertPass({ tokenHash: hashToken(tokens.gift), kind: 'gift', parentPassId: pass.id, expiresAt: pass.expiresAt });
  }
  const roomId = session.metadata.room_id;
  if (roomId && /^[0-9a-f-]{36}$/.test(roomId)) {
    if (await store.attachPass(roomId, pass.id)) publishRefresh(roomId);
  }
  return { passToken: tokens.pass, giftToken: tokens.gift };
}

/** Desbloquea una sala con un pase que ya se tiene (propio o regalado). */
export async function usePassOnRoom(roomId: string, token: string): Promise<PassState> {
  const res = await checkPass(token);
  if (res.state !== 'ok' || !res.pass) return res.state;
  await getRoomStore().attachPass(roomId, res.pass.id);
  publishRefresh(roomId);
  return 'ok';
}

export { paymentsEnabled };
