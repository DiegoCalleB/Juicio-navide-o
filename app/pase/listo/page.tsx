import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { PassReady } from '@/components/features/royal-chat/PassReady';
import { originFromHeaders } from '@/lib/site';
import { retrieveCheckoutSession } from '@/lib/stripe';
import { fulfillCheckout } from '@/services/passes';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tu Pase de Navidad', robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: '#0a1220' };

/** Vuelta de Stripe tras pagar: se confirma el pago con Stripe (nunca nos fiamos de la URL) y se muestra el pase. */
export default async function PassReadyPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const session = session_id ? await retrieveCheckoutSession(session_id) : null;
  const tokens = session ? await fulfillCheckout(session) : null;
  const origin = originFromHeaders(await headers());
  return (
    <PassReady
      passToken={tokens?.passToken ?? null}
      passLink={tokens ? `${origin}/?pase=${tokens.passToken}` : null}
      giftLink={tokens ? `${origin}/?pase=${tokens.giftToken}` : null}
    />
  );
}
