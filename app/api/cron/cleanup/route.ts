import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { getCronSecret } from '@/lib/env.server';
import { fail, json } from '@/lib/http';
import { secEvent } from '@/lib/securityLog';
import { purgeSeen } from '@/lib/metrics';
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
  if (!authorized(req)) {
    secEvent('cron_no_autorizado');
    return fail('UNAUTHORIZED', 'No autorizado', 401);
  }
  try {
    const result = await getRoomStore().deleteExpired(new Date().toISOString());
    await purgeSeen();
    // Correos sin consentimiento de novedades pasada la temporada. Si la tabla aún no existe (migración sin aplicar), no frena la limpieza.
    const contacts = await getRoomStore().purgeContacts(new Date(Date.now() - 150 * 86_400_000).toISOString()).catch((e) => {
      console.error('[cleanup] contactos:', e instanceof Error ? e.message : e);
      return 0;
    });
    return json({ ok: true, data: { ...result, contacts } });
  } catch (err) {
    console.error('[cleanup]', err);
    return fail('UNKNOWN', 'Error en la limpieza', 500);
  }
}
