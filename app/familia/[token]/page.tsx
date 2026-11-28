import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { FamilyPanel } from '@/components/features/royal-chat/FamilyPanel';
import { PinGate } from '@/components/features/royal-chat/PinGate';
import { LocaleProvider } from '@/components/LocaleProvider';
import { billingInfo } from '@/lib/billing';
import { originFromHeaders } from '@/lib/site';
import { familyHasPin, familyLockState } from '@/services/pin';
import { getFamily } from '@/services/rooms';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  return { title: 'Tu familia', manifest: `/familia/${token}/manifest.webmanifest`, robots: { index: false, follow: false } };
}
export const viewport: Viewport = { themeColor: '#0a1220' };

export default async function FamilyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const state = await familyLockState(token);
  if (state === 'missing') notFound();
  // Con PIN: sin desbloquear no se envía ningún nombre ni enlace.
  if (state === 'locked') return <PinGate token={token} />;
  const family = await getFamily(token);
  if (!family) notFound();
  const origin = originFromHeaders(await headers());
  return (
    <LocaleProvider locale={family.rooms[0]?.locale ?? 'es'}>
      <FamilyPanel familyToken={token} family={family} origin={origin} billing={billingInfo()} hasPin={await familyHasPin(token)} />
    </LocaleProvider>
  );
}
