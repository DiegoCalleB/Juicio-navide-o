import type { Viewport } from 'next';
import { RoyalLanding } from '@/components/features/royal-chat/RoyalLanding';
import { isCharacterId } from '@/lib/characters';
import { billingInfo } from '@/lib/billing';
import { siteNow } from '@/lib/clock';
import { getRequestLocale } from '@/lib/i18n.server';

/** Dinámica: el precio de lanzamiento cambia por fecha y los pagos se activan por variable de entorno. */
export const dynamic = 'force-dynamic';

export const viewport: Viewport = { themeColor: '#1d0b3a' };

export default async function HomePage({ searchParams }: { searchParams: Promise<{ personaje?: string }> }) {
  // /?personaje=duende_chispa (enlaces de campañas y de la página de trastadas) deja elegido a ese personaje.
  const { personaje } = await searchParams;
  const initialCharacter = personaje && isCharacterId(personaje) ? personaje : undefined;
  return <RoyalLanding billing={billingInfo()} locale={await getRequestLocale()} now={siteNow()} initialCharacter={initialCharacter} />;
}
