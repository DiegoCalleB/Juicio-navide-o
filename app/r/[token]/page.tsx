import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { LiveChildChat } from '@/components/features/royal-chat/LiveChildChat';
import { KINGS } from '@/lib/royal';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Mensajería Real de Oriente', robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: '#2a0f4a' };

export default async function ChildRoomPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findRoomByToken(token);
  if (!found || found.role !== 'child') notFound();
  return <LiveChildChat token={token} king={KINGS[found.room.king]} childName={found.room.childName} />;
}
