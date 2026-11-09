import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

/** Las salas (/r, /paje) usan enlaces secretos: nunca deben indexarse. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: ['/', '/privacidad', '/terminos'], disallow: ['/r/', '/paje/', '/api/', '/demo/'] }],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
