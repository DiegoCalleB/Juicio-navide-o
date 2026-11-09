import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { getServerEnv } from '@/lib/env.server';

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
