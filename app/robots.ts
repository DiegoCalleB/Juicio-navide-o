import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

/**
 * Solo se indexa el mundo mágico. La zona de mayores no hace falta listarla aquí: sin la puerta redirige a
 * /mayores y responde con X-Robots-Tag: noindex. Las salas de los niños (/r) usan enlaces secretos.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: ['/', '/diario-de-chispa'], disallow: ['/r/', '/api/', '/mayores'] }],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
