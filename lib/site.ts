/**
 * URL pública del sitio, solo para enlaces absolutos (OG, compartir).
 * Orden: NEXT_PUBLIC_SITE_URL → dominio público de Railway → localhost.
 * Acepta dominios sin protocolo ("miapp.up.railway.app"). Nunca rompe el build.
 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '') ||
    'http://localhost:3000';
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return 'http://localhost:3000';
  }
}
