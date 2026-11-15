import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();
  // Solo el mundo mágico (REGLA DE ORO): la zona de mayores no se indexa.
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/diario-de-chispa`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ];
}
