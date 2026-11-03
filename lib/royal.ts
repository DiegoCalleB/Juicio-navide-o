/** Configuración de los Reyes (compartida cliente/servidor; sin secretos). */
export const KING_IDS = ['melchor', 'gaspar', 'baltasar'] as const;
export type KingId = (typeof KING_IDS)[number];

export interface KingProfile {
  id: KingId;
  name: string;
  robe: string;
}

export const KINGS: Record<KingId, KingProfile> = {
  melchor: { id: 'melchor', name: 'Rey Melchor', robe: '#7a3fb0' },
  gaspar: { id: 'gaspar', name: 'Rey Gaspar', robe: '#2f6f4f' },
  baltasar: { id: 'baltasar', name: 'Rey Baltasar', robe: '#a8323a' },
};

export const REPLY_DELAYS = [0, 2, 10, 30] as const;
export type ReplyDelay = (typeof REPLY_DELAYS)[number];

/** DTO que viaja al cliente. */
export interface RoomMessageDTO {
  id: string;
  from: 'child' | 'king' | 'system';
  kind: 'text' | 'voice';
  text?: string;
  audioUrl?: string;
  duration?: number;
  at: string;
  /** Solo en el panel del Paje: aún no entregado al niño. */
  pending?: boolean;
}

export const MAX_VOICE_SECONDS = 60;
export const MAX_VOICE_BYTES = 2 * 1024 * 1024;
