import type { CharacterProfile } from '@/lib/characters';

export type Sender = 'king' | 'child' | 'system';
export type Character = CharacterProfile;

interface BaseMessage {
  id: string;
  from: Sender;
  time: string;
}

export type ChatMessage =
  | (BaseMessage & { kind: 'text'; text: string })
  | (BaseMessage & { kind: 'voice'; duration: number; seed: number; src?: string })
  | (BaseMessage & { kind: 'photo'; caption: string; /** URL real; sin ella se muestra la ilustración de la demo. */ src?: string });
