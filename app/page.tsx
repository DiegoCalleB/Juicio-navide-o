import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { BRAND, heroFor } from '@/lib/brand';
import { RoyalLanding } from '@/components/features/royal-chat/RoyalLanding';
import { isCharacterId } from '@/lib/characters';
import { billingInfo } from '@/lib/billing';
import { siteNow } from '@/lib/clock';
import { currentAge } from '@/lib/ageServer';
import { getRequestLocale } from '@/lib/i18n.server';

/** Dinámica: el precio de lanzamiento cambia por fecha y los pagos se activan por variable de entorno. */
export const dynamic = 'force-dynamic';

export const viewport: Viewport = { themeColor: '#1d0b3a' };

/** El título de la pestaña y la vista previa siguen a la portada de temporada (mismo gancho que el titular). */
export async function generateMetadata(): Promise<Metadata> {
  const hero = heroFor(siteNow());
  const title = `${BRAND} · ${hero.tagline}`;
  return {
    title: { absolute: title },
    description: hero.subtitle,
    openGraph: { type: 'website', siteName: BRAND, locale: 'es_ES', title, description: hero.subtitle },
    twitter: { card: 'summary_large_image', title, description: hero.subtitle },
  };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ personaje?: string; pase?: string }> }) {
  // Enlaces antiguos /?personaje=duende_chispa (campañas, trastadas): van directos a crear el portal con ese personaje.
  const { personaje, pase } = await searchParams;
  // Enlaces de pase (/?pase=…): el pase se activa en la zona de mayores, nunca en la portada pública.
  if (pase && /^[A-Za-z0-9_-]{20,80}$/.test(pase)) redirect(`/crear?pase=${pase}`);
  if (personaje && isCharacterId(personaje)) redirect(`/crear?personaje=${personaje}`);
  return <RoyalLanding billing={billingInfo()} locale={await getRequestLocale()} now={siteNow()} age={await currentAge()} />;
}
