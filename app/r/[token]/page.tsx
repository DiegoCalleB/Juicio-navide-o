import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { LiveChildChat } from '@/components/features/royal-chat/LiveChildChat';
import { CHARACTERS } from '@/lib/characters';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';
/** Lo que ve el niño (pestaña, pantalla de inicio) no menciona la app: es Papá Noel. */
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const found = await findRoomByToken(token);
  const name = found?.role === 'child' ? CHARACTERS[found.room.character].name : 'Mensaje mágico';
  return { title: { absolute: name }, applicationName: name, appleWebApp: { capable: true, title: name, statusBarStyle: 'black-translucent' }, robots: { index: false, follow: false } };
}
export const viewport: Viewport = { themeColor: '#2a0f4a' };

export default async function ChildRoomPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findRoomByToken(token);
  if (!found || found.role !== 'child') notFound();
  return <LiveChildChat token={token} character={CHARACTERS[found.room.character]} childName={found.room.childName} />;
}
