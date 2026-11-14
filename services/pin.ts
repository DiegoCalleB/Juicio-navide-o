import 'server-only';
import { cookies } from 'next/headers';
import {
  hashSecret,
  newRecoveryCode,
  normalizeRecovery,
  PIN_REGEX,
  signUnlock,
  unlockCookieName,
  UNLOCK_MINUTES,
  verifySecret,
  verifyUnlock,
} from '@/lib/pin';
import { hashToken, TOKEN_REGEX } from '@/lib/tokens';
import { getRoomStore } from '@/services/room-store';
import type { RoomRecord } from '@/services/room-store/types';

/**
 * Bloqueo parental: un PIN protege el panel de los padres (y la lista de la familia) en el SERVIDOR.
 * Sin la cookie de desbloqueo (firmada, caduca a los 30 min) no se devuelve ningún dato de la sala.
 * El ámbito del PIN es la familia (todas sus salas) o, si la sala no tiene familia, la propia sala.
 */

export const scopeOf = (room: { id: string; familyHash: string | null }) => room.familyHash ?? room.id;

const cookieOptions = (maxAge: number) => ({ httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge });

export async function isUnlocked(scope: string): Promise<boolean> {
  try {
    return verifyUnlock((await cookies()).get(unlockCookieName(scope))?.value, scope);
  } catch {
    return false; // fuera de una petición: se trata como bloqueado
  }
}

export async function grantUnlock(scope: string): Promise<void> {
  (await cookies()).set(unlockCookieName(scope), signUnlock(scope, Date.now() + UNLOCK_MINUTES * 60_000), cookieOptions(UNLOCK_MINUTES * 60));
}

export async function revokeUnlock(scope: string): Promise<void> {
  (await cookies()).set(unlockCookieName(scope), '', cookieOptions(0));
}

// ── Intentos fallidos (por familia/sala, en memoria): 5 fallos → espera de 15 min, que se duplica cada vez (máx. 6 h)

interface Fails {
  count: number;
  lockedUntil: number;
  locks: number;
}
const g = globalThis as unknown as { __pinFails?: Map<string, Fails> };
const fails = () => (g.__pinFails ??= new Map());
const MAX_FAILS = 5;

/** Milisegundos de espera que quedan (0 = se puede intentar). */
export function waitMs(key: string): number {
  const f = fails().get(key);
  return f && f.lockedUntil > Date.now() ? f.lockedUntil - Date.now() : 0;
}

function registerFail(key: string): { locked: boolean; left: number } {
  const map = fails();
  const f = map.get(key) ?? { count: 0, lockedUntil: 0, locks: 0 };
  f.count += 1;
  if (f.count >= MAX_FAILS) {
    f.lockedUntil = Date.now() + Math.min(6 * 3_600_000, 15 * 60_000 * 2 ** f.locks);
    f.locks += 1;
    f.count = 0;
    map.set(key, f);
    return { locked: true, left: 0 };
  }
  map.set(key, f);
  return { locked: false, left: MAX_FAILS - f.count };
}

const registerOk = (key: string) => void fails().delete(key);

export type PinOutcome =
  | { ok: true; recovery?: string }
  | { ok: false; code: 'INVALID' | 'WRONG' | 'LOCKED' | 'NOT_FOUND' | 'FORBIDDEN'; message: string; minutes?: number; left?: number };

const minutesOf = (ms: number) => Math.max(1, Math.ceil(ms / 60_000));
const lockedMessage = (ms: number): PinOutcome => ({
  ok: false,
  code: 'LOCKED',
  minutes: minutesOf(ms),
  message: `Demasiados intentos. Espera ${minutesOf(ms)} minutos antes de volver a probar.`,
});

interface Resolved {
  rec: RoomRecord;
  scope: string;
  /** El enlace era el de padres (true) o el de familia (false). */
  viaParent: boolean;
}

/** Enlace de padres o de familia → registro con su PIN y su ámbito. */
export async function resolveByToken(token: string): Promise<Resolved | null> {
  if (!TOKEN_REGEX.test(token)) return null;
  const store = getRoomStore();
  const h = hashToken(token);
  const rec = await store.findRoomByTokenHash(h);
  if (rec && rec.parentTokenHash === h) return { rec, scope: scopeOf(rec), viaParent: true };
  if (rec) return null; // enlace del niño: nunca
  const fam = await store.listRoomsByFamilyHash(h);
  const first = fam.find((r) => r.parentPin) ?? fam[0];
  return first ? { rec: first, scope: h, viaParent: false } : null;
}

/** ¿Está protegida esta familia y está desbloqueada? */
/** ¿Tiene PIN la familia? (para enseñar el botón de bloquear). */
export async function familyHasPin(familyToken: string): Promise<boolean> {
  const r = await resolveByToken(familyToken);
  return !!r && !r.viaParent && !!r.rec.parentPin;
}

export async function familyLockState(familyToken: string): Promise<'missing' | 'open' | 'locked'> {
  const r = await resolveByToken(familyToken);
  if (!r || r.viaParent) return 'missing';
  if (!r.rec.parentPin) return 'open';
  return (await isUnlocked(r.scope)) ? 'open' : 'locked';
}

/** Introducir el PIN (con el enlace de padres o el de familia). */
export async function tryUnlock(token: string, pin: string): Promise<PinOutcome> {
  const r = await resolveByToken(token);
  if (!r) return { ok: false, code: 'NOT_FOUND', message: 'No encontrado.' };
  if (!r.rec.parentPin) return { ok: true };
  if (!PIN_REGEX.test(pin)) return { ok: false, code: 'INVALID', message: 'El PIN tiene de 4 a 6 cifras.' };
  const wait = waitMs(r.scope);
  if (wait > 0) return lockedMessage(wait);
  if (!verifySecret(pin, r.rec.parentPin)) {
    const f = registerFail(r.scope);
    if (f.locked) return lockedMessage(waitMs(r.scope));
    return { ok: false, code: 'WRONG', left: f.left, message: `PIN incorrecto. Te quedan ${f.left} intentos.` };
  }
  registerOk(r.scope);
  await grantUnlock(r.scope);
  return { ok: true };
}

/** Pone (o cambia) el PIN. Quien llama ya ha comprobado que el panel está desbloqueado. Devuelve el código de rescate, solo esta vez. */
export async function setPin(parentToken: string, pin: string): Promise<PinOutcome> {
  if (!PIN_REGEX.test(pin)) return { ok: false, code: 'INVALID', message: 'El PIN tiene de 4 a 6 cifras.' };
  const r = await resolveByToken(parentToken);
  if (!r || !r.viaParent) return { ok: false, code: 'NOT_FOUND', message: 'No encontrado.' };
  const recovery = newRecoveryCode();
  await getRoomStore().setPin({ roomId: r.rec.id, familyHash: r.rec.familyHash }, hashSecret(pin), hashSecret(normalizeRecovery(recovery)));
  registerOk(r.scope);
  await grantUnlock(r.scope);
  return { ok: true, recovery };
}

/** Quita el PIN: hay que dar el actual. */
export async function removePin(parentToken: string, pin: string): Promise<PinOutcome> {
  const r = await resolveByToken(parentToken);
  if (!r || !r.viaParent) return { ok: false, code: 'NOT_FOUND', message: 'No encontrado.' };
  if (!r.rec.parentPin) return { ok: true };
  const wait = waitMs(r.scope);
  if (wait > 0) return lockedMessage(wait);
  if (!verifySecret(pin, r.rec.parentPin)) {
    const f = registerFail(r.scope);
    return f.locked ? lockedMessage(waitMs(r.scope)) : { ok: false, code: 'WRONG', left: f.left, message: `PIN incorrecto. Te quedan ${f.left} intentos.` };
  }
  registerOk(r.scope);
  await getRoomStore().setPin({ roomId: r.rec.id, familyHash: r.rec.familyHash }, null, null);
  return { ok: true };
}

/** Bloquea ahora: el siguiente que abra el panel tendrá que poner el PIN. */
export async function lockNow(token: string): Promise<void> {
  const r = await resolveByToken(token);
  if (r) await revokeUnlock(r.scope);
}

/** Olvidé el PIN: el código de rescate lo quita y desbloquea (después se puede poner uno nuevo). */
export async function recoverPin(token: string, code: string): Promise<PinOutcome> {
  const r = await resolveByToken(token);
  if (!r) return { ok: false, code: 'NOT_FOUND', message: 'No encontrado.' };
  if (!r.rec.parentPin) return { ok: true };
  const key = `rec:${r.scope}`;
  const wait = waitMs(key);
  if (wait > 0) return lockedMessage(wait);
  if (!r.rec.pinRecovery || !verifySecret(normalizeRecovery(code), r.rec.pinRecovery)) {
    const f = registerFail(key);
    return f.locked ? lockedMessage(waitMs(key)) : { ok: false, code: 'WRONG', left: f.left, message: `Código incorrecto. Te quedan ${f.left} intentos.` };
  }
  registerOk(key);
  await getRoomStore().setPin({ roomId: r.rec.id, familyHash: r.rec.familyHash }, null, null);
  await grantUnlock(r.scope);
  return { ok: true };
}
