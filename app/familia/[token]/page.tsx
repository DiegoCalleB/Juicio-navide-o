import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { FamilyPanel } from '@/components/features/royal-chat/FamilyPanel';
import { LocaleProvider } from '@/components/LocaleProvider';
import { billingInfo } from '@/lib/billing';
import { originFromHeaders } from '@/lib/site';
import { getFamily } from '@/services/rooms';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tu familia', robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: '#0a1220' };

export default async function FamilyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const family = await getFamily(token);
  if (!family) notFound();
  const origin = originFromHeaders(await headers());
  return (
    <LocaleProvider locale={family.rooms[0]?.locale ?? 'es'}>
      <FamilyPanel familyToken={token} family={family} origin={origin} billing={billingInfo()} />
    </LocaleProvider>
  );
}
