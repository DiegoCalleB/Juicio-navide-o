import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { PajePanel } from '@/components/features/royal-chat/PajePanel';
import { CHARACTERS } from '@/lib/characters';
import { getSiteUrl } from '@/lib/site';
import { deriveChildToken } from '@/lib/tokens';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Panel de los padres', robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: '#1d0b3a' };

export default async function PajePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findRoomByToken(token);
  if (!found || found.role !== 'parent') notFound();
  const childLink = `${getSiteUrl()}/r/${deriveChildToken(token)}`;
  return <PajePanel token={token} childLink={childLink} character={CHARACTERS[found.room.character]} childName={found.room.childName} />;
}
