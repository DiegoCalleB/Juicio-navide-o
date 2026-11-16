/**
 * Bloqueo progresivo de la puerta de mayores (REGLA DE ORO, AGENTS.md).
 *
 * Dos llaves por intento: el dispositivo (IP + navegador) y la red (solo IP). Cada una cuenta fallos seguidos;
 * al pasar el límite se bloquea y cada bloqueo es más largo que el anterior (15 min, 1 h, 24 h). La red
 * tiene un límite más alto para no dejar fuera a toda una casa por los fallos de un peque, pero impide
 * ir cambiando de navegador para seguir probando.
 *
 * En memoria, por instancia (como el resto de límites de la app).
 */
const MIN = 60_000;
const FORGET_MS = 48 * 60 * MIN;

export interface Policy {
  /** Fallos seguidos que provocan un bloqueo. */
  max: number;
  /** Duración de cada bloqueo sucesivo (el último se repite). */
  steps: number[];
  /** Sin fallar durante este tiempo, la cuenta de fallos vuelve a cero. */
  resetAfter: number;
}

export const DEVICE: Policy = { max: 3, steps: [15 * MIN, 60 * MIN, 24 * 60 * MIN], resetAfter: 30 * MIN };
export const NETWORK: Policy = { max: 9, steps: [15 * MIN, 60 * MIN, 60 * MIN], resetAfter: 60 * MIN };

interface Entry {
  n: number;
  level: number;
  until: number;
  last: number;
}

function store(): Map<string, Entry> {
  const g = globalThis as unknown as { __gateLock?: Map<string, Entry> };
  return (g.__gateLock ??= new Map());
}

/** Milisegundos que le quedan de bloqueo (0 si no está bloqueado). */
export function lockedFor(key: string, now = Date.now()): number {
  const e = store().get(key);
  return e && e.until > now ? e.until - now : 0;
}

/** Apunta un fallo. Devuelve los ms de bloqueo si este fallo lo provoca, o 0. */
export function recordFail(key: string, policy: Policy, now = Date.now()): number {
  const map = store();
  let e = map.get(key);
  if (!e || now - e.last > FORGET_MS) e = { n: 0, level: 0, until: 0, last: now };
  if (now - e.last > policy.resetAfter && e.until <= now) e.n = 0;
  e.n += 1;
  e.last = now;
  let lock = 0;
  if (e.n >= policy.max) {
    lock = policy.steps[Math.min(e.level, policy.steps.length - 1)] ?? policy.steps[0]!;
    e.until = now + lock;
    e.level += 1;
    e.n = 0;
  }
  map.set(key, e);
  if (map.size > 5000) for (const [k, v] of map) if (v.until < now && now - v.last > FORGET_MS) map.delete(k);
  return lock;
}

/** Tras entrar bien, el dispositivo vuelve a empezar (el nivel de bloqueo se conserva un tiempo). */
export function clearFails(key: string): void {
  const e = store().get(key);
  if (e) e.n = 0;
}

export function humanWait(ms: number): string {
  const m = Math.max(1, Math.ceil(ms / MIN));
  if (m < 60) return `${m} minuto${m === 1 ? '' : 's'}`;
  const h = Math.ceil(m / 60);
  return `${h} hora${h === 1 ? '' : 's'}`;
}
