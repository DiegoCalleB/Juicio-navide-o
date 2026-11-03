import type { Metadata, Viewport } from 'next';
import { RoyalChat } from '@/components/features/royal-chat/RoyalChat';
import type { ChatMessage, King } from '@/components/features/royal-chat/types';

export const metadata: Metadata = { title: 'Mensajería Real de Oriente', robots: { index: false } };
export const viewport: Viewport = { themeColor: '#2a0f4a' };

const MELCHOR: King = { id: 'melchor', name: 'Rey Melchor', robe: '#7a3fb0' };

const DEMO: ChatMessage[] = [
  { id: '1', from: 'king', kind: 'text', time: '19:41', text: '¡Hola, Lucía! Soy Melchor ✨\nMis pajes me acaban de traer tu carta desde Madrid.' },
  { id: '2', from: 'king', kind: 'voice', time: '19:41', duration: 18, seed: 4211 },
  { id: '3', from: 'king', kind: 'photo', time: '19:42', caption: 'Así se ve el palacio esta noche. Los camellos ya están preparando el viaje 🐪' },
  { id: '4', from: 'child', kind: 'voice', time: '19:43', duration: 7, seed: 977 },
  { id: '5', from: 'king', kind: 'text', time: '19:43', text: '¡Qué bien suena tu voz, Lucía! Gaspar y Baltasar te mandan un abrazo.' },
];

export default function MensajeriaDemo() {
  return <RoyalChat king={MELCHOR} childName="Lucía" initialMessages={DEMO} />;
}
