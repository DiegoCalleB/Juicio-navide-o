import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import { getServerEnv } from '@/lib/env.server';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/** ID corto de 8 caracteres, criptográficamente aleatorio (sin sesgo de módulo). */
export function generateShortId(): string {
  let out = '';
  while (out.length < 8) {
    for (const b of randomBytes(16)) {
      if (b < 256 - (256 % ALPHABET.length) && out.length < 8) out += ALPHABET[b % ALPHABET.length];
    }
  }
  return out;
}

export async function getClientFingerprint(): Promise<string> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? 'unknown';
  const ua = h.get('user-agent') ?? '';
  return createHash('sha256').update(`${getServerEnv().FINGERPRINT_SALT}|${ip}|${ua}`).digest('hex');
}

/**
 * Rate limit en memoria (por instancia) con ventana fija: coste O(1) por petición y barrido
 * periódico de entradas caducadas. Primera barrera barata; la autoritativa son los triggers
 * de Postgres. Sustituible por Upstash/Redis manteniendo la firma.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;
const SWEEP_EVERY_MS = 30_000;

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (now - lastSweep > SWEEP_EVERY_MS) {
    lastSweep = now;
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}
