/** Constantes y DTO compartidos de la mensajería (sin secretos). */
export const REPLY_DELAYS = [0, 2, 10, 30] as const;
export type ReplyDelay = (typeof REPLY_DELAYS)[number];

/** DTO que viaja al cliente. */
export interface RoomMessageDTO {
  id: string;
  from: 'child' | 'king' | 'system';
  kind: 'text' | 'voice' | 'photo';
  text?: string;
  audioUrl?: string;
  imageUrl?: string;
  duration?: number;
  at: string;
  /** Solo en el panel del Paje: aún no entregado al niño. */
  pending?: boolean;
}

export const MAX_VOICE_SECONDS = 60;
export const MAX_VOICE_BYTES = 2 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;
