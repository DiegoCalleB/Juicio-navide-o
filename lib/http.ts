import 'server-only';
import { NextResponse } from 'next/server';
import { getClientFingerprint, rateLimit } from '@/lib/security';
import { RoomError } from '@/services/room-errors';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };
/** Tope amplio por IP+navegador: frena abusos sin castigar a quien comparte conexión. */
const PER_CLIENT_MAX = 600;

export function json<T>(body: T, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function fail(code: string, message: string, status: number): NextResponse {
  return json({ ok: false, error: { code, message } }, status);
}

interface Limit {
  key: string;
  max: number;
  windowMs: number;
  /** Identifica el recurso limitado (p. ej. el token de la sala). Sin él, se limita por IP+navegador. */
  scope?: string;
}

/** Límite de frecuencia por sala (token) + tope por IP, y errores sin filtrar detalles. */
export async function guarded(name: string, limit: Limit, fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    const fp = await getClientFingerprint();
    if (!rateLimit(`all:${fp}`, PER_CLIENT_MAX, 60_000) || !rateLimit(`${limit.key}:${limit.scope ?? fp}`, limit.max, limit.windowMs)) {
      return fail('RATE_LIMITED', 'Demasiadas peticiones. Espera un momento.', 429);
    }
    return await fn();
  } catch (err) {
    if (err instanceof RoomError) {
      if (err.code === 'RATE_LIMITED') return fail('RATE_LIMITED', 'Demasiados mensajes por ahora. Inténtalo más tarde.', 429);
      if (err.code === 'INVALID_FILE') return fail('VALIDATION', 'Archivo no válido.', 415);
      if (err.code === 'TRIAL_ENDED') return fail('TRIAL_ENDED', 'La prueba gratis de esta sala ha terminado.', 402);
    }
    console.error(`[${name}]`, err);
    return fail('UNKNOWN', 'Ha habido un problema. Inténtalo de nuevo.', 500);
  }
}
