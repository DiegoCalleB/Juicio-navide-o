import type { Viewport } from 'next';
import { RoyalLanding } from '@/components/features/royal-chat/RoyalLanding';
import { billingInfo } from '@/lib/billing';
import { getRequestLocale } from '@/lib/i18n.server';

/** Dinámica: el precio de lanzamiento cambia por fecha y los pagos se activan por variable de entorno. */
export const dynamic = 'force-dynamic';

export const viewport: Viewport = { themeColor: '#1d0b3a' };

export default async function HomePage() {
  return <RoyalLanding billing={billingInfo()} locale={await getRequestLocale()} />;
}
