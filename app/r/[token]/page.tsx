import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { LocaleProvider } from '@/components/LocaleProvider';
import { LiveChildChat } from '@/components/features/royal-chat/LiveChildChat';
import { CHARACTERS, resolveCharacter } from '@/lib/characters';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';
/** Lo que ve el niño (pestaña, pantalla de inicio) no menciona la app: es Papá Noel. */
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const found = await findRoomByToken(token);
  const name = found?.role === 'child' ? resolveCharacter(CHARACTERS[found.room.character], { alias: found.room.characterAlias, gender: found.room.characterGender }).name : 'Mensaje mágico';
  return { manifest: found?.role === 'child' ? `/r/${token}/manifest.webmanifest` : undefined, title: { absolute: name }, applicationName: name, appleWebApp: { capable: true, title: name, statusBarStyle: 'black-translucent' }, robots: { index: false, follow: false } };
}
export const viewport: Viewport = { themeColor: '#2a0f4a' };

export default async function ChildRoomPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ letras?: string }> }) {
  const { token } = await params;
  const { letras } = await searchParams;
  const found = await findRoomByToken(token);
  if (!found || found.role !== 'child') notFound();
  return <LocaleProvider locale={found.room.locale}><LiveChildChat token={token} character={resolveCharacter(CHARACTERS[found.room.character], { alias: found.room.characterAlias, gender: found.room.characterGender, locale: found.room.locale })} childName={found.room.childName} initialCaps={letras === 'mayus' || found.room.readingLevel !== 'yes'} /></LocaleProvider>;
}
