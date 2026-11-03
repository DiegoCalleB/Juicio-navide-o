import type { KingProfile } from '@/lib/royal';

export type Sender = 'king' | 'child' | 'system';
export type King = KingProfile;

interface BaseMessage {
  id: string;
  from: Sender;
  time: string;
}

export type ChatMessage =
  | (BaseMessage & { kind: 'text'; text: string })
  | (BaseMessage & { kind: 'voice'; duration: number; seed: number; src?: string })
  | (BaseMessage & { kind: 'photo'; caption: string });
