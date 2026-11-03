import 'server-only';
import { NextResponse } from 'next/server';
import { getClientFingerprint, rateLimit } from '@/lib/security';
import { RoomError } from '@/services/rooms';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

export function json<T>(body: T, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function fail(code: string, message: string, status: number): NextResponse {
  return json({ ok: false, error: { code, message } }, status);
}

/** Envuelve un handler: límite de frecuencia por huella + errores sin filtrar detalles. */
export async function guarded(
  name: string,
  limit: { key: string; max: number; windowMs: number },
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const fp = await getClientFingerprint();
    if (!rateLimit(`${limit.key}:${fp}`, limit.max, limit.windowMs)) {
      return fail('RATE_LIMITED', 'Demasiadas peticiones. Espera un momento.', 429);
    }
    return await fn();
  } catch (err) {
    if (err instanceof RoomError && err.code === 'RATE_LIMITED') {
      return fail('RATE_LIMITED', 'Demasiados mensajes por ahora. Inténtalo más tarde.', 429);
    }
    console.error(`[${name}]`, err);
    return fail('UNKNOWN', 'Los pajes han tenido un problema. Inténtalo de nuevo.', 500);
  }
}
