import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { getCronSecret } from '@/lib/env.server';
import { fail, json } from '@/lib/http';
import { getRoomStore } from '@/services/room-store';

export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  const secret = getCronSecret();
  if (!secret) return false;
  const given = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Borra salas caducadas con sus mensajes y archivos (cumple la promesa de borrado).
 * Llamar a diario: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://tu-dominio/api/cron/cleanup`
 */
export async function POST(req: NextRequest) {
  if (!authorized(req)) return fail('UNAUTHORIZED', 'No autorizado', 401);
  try {
    const result = await getRoomStore().deleteExpired(new Date().toISOString());
    return json({ ok: true, data: result });
  } catch (err) {
    console.error('[cleanup]', err);
    return fail('UNKNOWN', 'Error en la limpieza', 500);
  }
}
