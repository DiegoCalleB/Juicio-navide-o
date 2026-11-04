/**
 * URL pública del sitio, para enlaces absolutos (OG, compartir, sitemap).
 * Orden: NEXT_PUBLIC_SITE_URL → dominio público de Railway → localhost.
 * Acepta dominios sin protocolo ("miapp.up.railway.app"). Nunca rompe el build.
 * Ignora dominios privados (*.railway.internal, *.local): no son accesibles desde fuera.
 */
const isPrivateHost = (host: string) => /(^|\.)railway\.internal$|\.local$|\.svc\.cluster\.local$/i.test(host);

function normalize(raw: string): string | null {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    return isPrivateHost(url.hostname) ? null : url.origin;
  } catch {
    return null;
  }
}

export function getSiteUrl(): string {
  const candidates = [process.env.NEXT_PUBLIC_SITE_URL?.trim(), process.env.RAILWAY_PUBLIC_DOMAIN?.trim()];
  for (const c of candidates) {
    const origin = c ? normalize(c) : null;
    if (origin) return origin;
  }
  return 'http://localhost:3000';
}

/**
 * Origen con el que el visitante ha llegado (detrás del proxy de Railway). Es lo más fiable para
 * generar enlaces que luego se comparten: usa el dominio real aunque la variable de entorno esté mal.
 * `headers` viene de `next/headers`.
 */
export function originFromHeaders(headers: { get(name: string): string | null }): string {
  const host = (headers.get('x-forwarded-host') ?? headers.get('host') ?? '').split(',')[0]?.trim();
  if (host && !isPrivateHost(host.split(':')[0] ?? host)) {
    const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
    const proto = (headers.get('x-forwarded-proto') ?? (local ? 'http' : 'https')).split(',')[0]?.trim() || 'https';
    const origin = normalize(`${proto}://${host}`);
    if (origin) return origin;
  }
  return getSiteUrl();
}
