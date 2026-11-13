import type { MetadataRoute } from 'next';
import { elfNights } from '@/lib/elfIdeas';
import { getSiteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/ideas-elfo`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/ideas-elfo/sin-tiempo`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    ...elfNights().map((n) => ({ url: `${base}/ideas-elfo/${n.day}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 })),
    { url: `${base}/privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terminos`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
