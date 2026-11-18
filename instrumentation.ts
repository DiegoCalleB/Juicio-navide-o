/**
 * Registro de errores del servidor en los logs (Railway), sin datos personales:
 * los enlaces secretos de las rutas se sustituyen por ":token".
 * Es la base mínima mientras no haya un servicio de seguimiento de errores.
 */
/**
 * Comprobación de arranque en producción: sin las claves críticas el servidor no arranca (el despliegue falla y
 * Railway mantiene la versión anterior), en vez de funcionar a medias o con secretos débiles.
 * Solo comprueba que existen y su longitud; nunca escribe sus valores.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NODE_ENV !== 'production') return;
  if (process.env.ROOMS_STORE === 'memory') return; // pruebas de carga
  const need = (name: string, min: number) => (process.env[name] ?? '').length >= min;
  const critical: [string, number][] = [
    ['FINGERPRINT_SALT', 16],
    ['NEXT_PUBLIC_SUPABASE_URL', 10],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 20],
    ['SUPABASE_SECRET_KEY', 20],
  ];
  const missing = critical.filter(([n, m]) => !need(n, m)).map(([n]) => n);
  if (missing.length) throw new Error(`Variables de entorno críticas ausentes o demasiado cortas: ${missing.join(', ')}.`);
  const advice: [string, number][] = [['CRON_SECRET', 16], ['NEXT_PUBLIC_SITE_URL', 8]];
  const weak = advice.filter(([n, m]) => !need(n, m)).map(([n]) => n);
  if (weak.length) console.error('[config]', `Faltan variables recomendadas: ${weak.join(', ')}.`);
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_WEBHOOK_SECRET) console.error('[config]', 'Hay STRIPE_SECRET_KEY pero falta STRIPE_WEBHOOK_SECRET: los pagos cerrados sin volver a la web no se aplicarán.');
  if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) console.warn('[config]', 'Stripe está en modo de PRUEBA (sk_test_).');
}

const redact = (path: string) => path.replace(/[A-Za-z0-9_-]{43}/g, ':token');

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  const e = err as { message?: string; digest?: string };
  console.error(
    '[server-error]',
    JSON.stringify({
      method: request.method,
      path: redact(request.path),
      route: context.routePath,
      type: context.routeType,
      message: e?.message ?? String(err),
      digest: e?.digest,
    }),
  );
}
