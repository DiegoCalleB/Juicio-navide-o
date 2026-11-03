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
 * Rate limit por ventana deslizante en memoria (por instancia). Primera barrera barata;
 * la barrera autoritativa son los triggers de Postgres. Sustituible por Upstash/Redis.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return true;
}
