import type { Metadata, Viewport } from 'next';
import { DemoChat } from '@/components/features/royal-chat/DemoChat';
import { demoFor } from '@/components/features/royal-chat/demoData';
import { CHARACTERS, isCharacterId } from '@/lib/characters';

export const metadata: Metadata = { title: 'Mensajería Mágica de Navidad', robots: { index: false } };
export const viewport: Viewport = { themeColor: '#2a0f4a' };

export default async function MensajeriaDemo({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const character = CHARACTERS[p && isCharacterId(p) ? p : 'melchor'];
  return <DemoChat character={character} childName="Lucía" initial={demoFor(character.group)} />;
}
