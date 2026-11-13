import 'server-only';
import { createHmac } from 'node:crypto';
import { siteNow } from '@/lib/clock';
import { isMemoryStore } from '@/services/room-store';

/**
 * Monetización (decidida el 12-nov):
 *  - Prueba gratis: 1 sala, texto y fotos durante 3 días.
 *  - Pase de Navidad: pago único (3,99 € hasta el 1-dic, después 4,99 €), salas ilimitadas
 *    (tope suave de 10), válido hasta el 20 de enero, y 1 pase para regalar.
 * Todo está apagado mientras no haya STRIPE_SECRET_KEY: la app sigue siendo gratis y sin límites.
 */

export const TRIAL_DAYS = 3;
/** Pruebas gratis por dispositivo/conexión cada 30 días: una por peque (5 por defecto). Límite suave, nunca un bloqueo por IP. */
export const TRIALS_PER_CREATOR = Math.max(1, Math.min(20, Number(process.env.TRIALS_PER_DEVICE) || 5));
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

/** Hora que usa la facturación (la real, salvo FAKE_NOW en pruebas). */
export function billingNow(): Date {
  return siteNow();
}

/** Campaña de Black Friday: del 27 al 30 de noviembre (hora de España), a 2,99 € por defecto. Se apaga con BLACKFRIDAY=0. */
export function blackFridayWindow(now: Date = billingNow()): { from: string; until: string; active: boolean } | null {
  if (process.env.BLACKFRIDAY === '0') return null;
  const year = now.getUTCFullYear();
  const from = process.env.BLACKFRIDAY_FROM || `${year}-11-27`;
  const until = process.env.BLACKFRIDAY_UNTIL || `${year}-11-30`; // inclusive
  const start = Date.parse(`${from}T00:00:00+01:00`);
  const end = Date.parse(`${until}T00:00:00+01:00`) + 86_400_000;
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return { from, until, active: now.getTime() >= start && now.getTime() < end };
}

/** Precio actual en céntimos (IVA incluido). Configurable sin tocar código. */
export function currentPrice(now: Date = billingNow()): { cents: number; launch: boolean; launchUntil: string | null; blackFriday: boolean } {
  // Precio de temporada: 3,99 € todo el año. "Lanzamiento" solo existe si se configura PASS_LAUNCH_UNTIL (AAAA-MM-DD).
  const launchUntil = process.env.PASS_LAUNCH_UNTIL || null;
  const launch = !!launchUntil && now.getTime() < Date.parse(`${launchUntil}T00:00:00+01:00`);
  const bf = blackFridayWindow(now)?.active ?? false;
  return {
    cents: bf ? num(process.env.PASS_PRICE_BLACKFRIDAY_CENTS, 299) : launch ? num(process.env.PASS_PRICE_LAUNCH_CENTS, 399) : num(process.env.PASS_PRICE_CENTS, 399),
    launch,
    launchUntil,
    blackFriday: bf,
  };
}

export const formatEuros = (cents: number) => (cents / 100).toFixed(2).replace('.', ',') + ' €';

/** Año de la Navidad en curso (en enero, la del año anterior). */
function seasonYear(now: Date): number {
  return now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
}

/** El pase vale hasta el 20 de enero de esta temporada (mínimo 7 días); fuera de temporada, 45 días. */
export function passExpiresAt(now: Date = billingNow()): Date {
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
export function billingInfo(now: Date = billingNow()): { enabled: boolean; price: string; launchNote: string | null; campaign: { label: string; until: string } | null } {
  const p = currentPrice(now);
  let launchNote: string | null = null;
  let campaign: { label: string; until: string } | null = null;
  const bf = blackFridayWindow(now);
  if (p.blackFriday && bf) {
    // Último día de la campaña, escrito como "lunes 30 de noviembre".
    const last = new Date(Date.parse(`${bf.until}T12:00:00+01:00`));
    const until = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' }).format(last).replace(',', '');
    campaign = { label: 'Oferta Black Friday', until };
  } else if (p.launch && p.launchUntil) {
    // El lanzamiento acaba al empezar `launchUntil`: el último día es el anterior.
    const last = new Date(Date.parse(`${p.launchUntil}T12:00:00Z`) - 86_400_000);
    launchNote = `hasta el ${last.getUTCDate()} de ${MONTHS[last.getUTCMonth()]}`;
  }
  return { enabled: paymentsEnabled(), price: formatEuros(p.cents), launchNote, campaign };
}
