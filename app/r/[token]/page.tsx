import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { LiveChildChat } from '@/components/features/royal-chat/LiveChildChat';
import { CHARACTERS } from '@/lib/characters';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Mensajería Mágica de Navidad', robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: '#2a0f4a' };

export default async function ChildRoomPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findRoomByToken(token);
  if (!found || found.role !== 'child') notFound();
  return <LiveChildChat token={token} character={CHARACTERS[found.room.character]} childName={found.room.childName} />;
}
