import 'server-only';
import { createHmac } from 'node:crypto';
import { isMemoryStore } from '@/services/room-store';

/**
 * Monetización (decidida el 12-nov):
 *  - Prueba gratis: 1 sala, texto y fotos durante 3 días.
 *  - Pase de Navidad: pago único (3,99 € hasta el 1-dic, después 4,99 €), salas ilimitadas
 *    (tope suave de 10), válido hasta el 20 de enero, y 1 pase para regalar.
 * Todo está apagado mientras no haya STRIPE_SECRET_KEY: la app sigue siendo gratis y sin límites.
 */

export const TRIAL_DAYS = 3;
/** Pruebas gratis por dispositivo/conexión cada 30 días (límite suave, nunca un bloqueo por IP). */
export const TRIALS_PER_CREATOR = 2;
export const TRIAL_WINDOW_DAYS = 30;

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
};

/** Pruebas automáticas: Stripe simulado (solo con el almacén en memoria, que nunca va en producción). */
export function isStripeFake(): boolean {
  return process.env.STRIPE_FAKE === '1' && isMemoryStore();
}

/** Duración de la prueba. En las pruebas automáticas (Stripe simulado) se puede acortar a segundos. */
export function trialMs(): number {
  const s = Number(process.env.TRIAL_TEST_SECONDS);
  if (isStripeFake() && Number.isFinite(s) && s > 0) return s * 1000;
  return TRIAL_DAYS * 86_400_000;
}

/** Cobros activos: hay clave de Stripe (o el simulador de pruebas). */
export function paymentsEnabled(): boolean {
  return isStripeFake() || (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_');
}

/** Precio actual en céntimos (IVA incluido). Configurable sin tocar código. */
export function currentPrice(now: Date = new Date()): { cents: number; launch: boolean; launchUntil: string } {
  const launchUntil = process.env.PASS_LAUNCH_UNTIL || `${seasonYear(now)}-12-01`;
  const launch = now.getTime() < Date.parse(`${launchUntil}T00:00:00+01:00`);
  return {
    cents: launch ? num(process.env.PASS_PRICE_LAUNCH_CENTS, 399) : num(process.env.PASS_PRICE_CENTS, 499),
    launch,
    launchUntil,
  };
}

export const formatEuros = (cents: number) => (cents / 100).toFixed(2).replace('.', ',') + ' €';

/** Año de la Navidad en curso (en enero, la del año anterior). */
function seasonYear(now: Date): number {
  return now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
}

/** El pase vale hasta el 20 de enero de esta temporada (mínimo 7 días); fuera de temporada, 45 días. */
export function passExpiresAt(now: Date = new Date()): Date {
  const end = new Date(Date.UTC(seasonYear(now) + 1, 0, 20, 23, 59));
  const left = end.getTime() - now.getTime();
  if (left > 0 && left <= 130 * 86_400_000) return new Date(Math.max(end.getTime(), now.getTime() + 7 * 86_400_000));
  return new Date(now.getTime() + 45 * 86_400_000);
}

/**
 * Tokens del pase derivados de la sesión de Stripe con un secreto del servidor: así el webhook
 * y la página de "pago completado" llegan al mismo pase sin guardarlo en claro.
 */
export function derivePassTokens(stripeSessionId: string): { pass: string; gift: string } {
  const secret = process.env.PASS_SECRET || process.env.FINGERPRINT_SALT;
  if (!secret || secret.length < 16) throw new Error('Falta PASS_SECRET (o FINGERPRINT_SALT) para los pases.');
  const mk = (kind: string) => createHmac('sha256', secret).update(`${kind}:${stripeSessionId}`).digest('base64url');
  return { pass: mk('pass'), gift: mk('gift') };
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Lo que necesitan las pantallas de los padres para mostrar la oferta. */
export function billingInfo(now: Date = new Date()): { enabled: boolean; price: string; launchNote: string | null } {
  const p = currentPrice(now);
  let launchNote: string | null = null;
  if (p.launch) {
    // El lanzamiento acaba al empezar `launchUntil`: el último día es el anterior.
    const last = new Date(Date.parse(`${p.launchUntil}T12:00:00Z`) - 86_400_000);
    launchNote = `hasta el ${last.getUTCDate()} de ${MONTHS[last.getUTCMonth()]}`;
  }
  return { enabled: paymentsEnabled(), price: formatEuros(p.cents), launchNote };
}
