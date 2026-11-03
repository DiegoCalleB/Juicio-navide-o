export type Sender = 'king' | 'child';

interface BaseMessage {
  id: string;
  from: Sender;
  time: string;
}

export type ChatMessage =
  | (BaseMessage & { kind: 'text'; text: string })
  | (BaseMessage & { kind: 'voice'; duration: number; seed: number })
  | (BaseMessage & { kind: 'photo'; caption: string });

export interface King {
  id: 'melchor' | 'gaspar' | 'baltasar';
  name: string;
  /** Color del manto: tiñe avatar y detalles. */
  robe: string;
}
