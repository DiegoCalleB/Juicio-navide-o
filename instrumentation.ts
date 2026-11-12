/**
 * Registro de errores del servidor en los logs (Railway), sin datos personales:
 * los enlaces secretos de las rutas se sustituyen por ":token".
 * Es la base mínima mientras no haya un servicio de seguimiento de errores.
 */
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
