import type { Metadata, Viewport } from 'next';
import { DemoChat } from '@/components/features/royal-chat/DemoChat';
import type { ChatMessage } from '@/components/features/royal-chat/types';
import { CHARACTERS, isCharacterId } from '@/lib/characters';

export const metadata: Metadata = { title: 'Mensajería Mágica de Navidad', robots: { index: false } };
export const viewport: Viewport = { themeColor: '#2a0f4a' };

const REYES: ChatMessage[] = [
  { id: '1', from: 'king', kind: 'text', time: '19:41', text: '¡Hola, Lucía! Soy Melchor ✨\nMis pajes me acaban de traer tu carta desde Madrid.' },
  { id: '2', from: 'king', kind: 'voice', time: '19:41', duration: 18, seed: 4211 },
  { id: '3', from: 'king', kind: 'photo', time: '19:42', caption: 'Así se ve el palacio esta noche. Los camellos ya están preparando el viaje 🐪' },
  { id: '4', from: 'child', kind: 'voice', time: '19:43', duration: 7, seed: 977 },
  { id: '5', from: 'king', kind: 'text', time: '19:43', text: '¡Qué bien suena tu voz, Lucía! Gaspar y Baltasar te mandan un abrazo.' },
];

const NOEL: ChatMessage[] = [
  { id: '1', from: 'king', kind: 'text', time: '19:41', text: '¡Jo, jo, jo! Hola, Lucía 🎅\nLos duendes me acaban de traer tu carta al Polo Norte.' },
  { id: '2', from: 'king', kind: 'voice', time: '19:41', duration: 18, seed: 3187 },
  { id: '3', from: 'child', kind: 'text', time: '19:43', text: 'Hola Papá Noel, ¿está Rodolfo contigo?' },
  { id: '4', from: 'king', kind: 'text', time: '19:44', text: '¡Aquí está, comiéndose una zanahoria! Te manda un saludo con su nariz roja.' },
];

export default async function MensajeriaDemo({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const character = CHARACTERS[p && isCharacterId(p) ? p : 'melchor'];
  return <DemoChat character={character} childName="Lucía" initial={character.group === 'noel' ? NOEL : REYES} />;
}
