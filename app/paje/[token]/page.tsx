import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { LocaleProvider } from '@/components/LocaleProvider';
import { PajePanel } from '@/components/features/royal-chat/PajePanel';
import { CHARACTERS, resolveCharacter } from '@/lib/characters';
import { originFromHeaders } from '@/lib/site';
import { deriveChildToken } from '@/lib/tokens';
import { billingInfo } from '@/lib/billing';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  return { title: 'Panel de los padres', manifest: `/paje/${token}/manifest.webmanifest`, robots: { index: false, follow: false } };
}
export const viewport: Viewport = { themeColor: '#0a1220' };

export default async function PajePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findRoomByToken(token);
  if (!found || found.role !== 'parent') notFound();
  const childLink = `${originFromHeaders(await headers())}/r/${deriveChildToken(token, found.room.childLinkVersion)}`;
  const character = resolveCharacter(CHARACTERS[found.room.character], { alias: found.room.characterAlias, gender: found.room.characterGender, locale: found.room.locale });
  return (
    <LocaleProvider locale={found.room.locale}>
    <PajePanel
      token={token}
      childLink={childLink}
      character={character}
      childName={found.room.childName}
      characterAlias={found.room.characterAlias}
      characterGender={found.room.characterGender}
      readingLevel={found.room.readingLevel}
      billing={billingInfo()}
    />
    </LocaleProvider>
  );
}
