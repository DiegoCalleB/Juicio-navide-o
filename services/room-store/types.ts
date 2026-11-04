export type Bucket = 'voices' | 'media';
export type Sender = 'child' | 'king' | 'system';
export type MessageKind = 'text' | 'voice' | 'photo';

export interface RoomRecord {
  id: string;
  childName: string;
  characterId: string;
  childTokenHash: string;
  parentTokenHash: string;
}

export interface MessageRecord {
  id: string;
  roomId: string;
  sender: Sender;
  kind: MessageKind;
  body: string | null;
  audioPath: string | null;
  imagePath: string | null;
  durationS: number | null;
  effect: 'surprise' | null;
  deliverAt: string;
  createdAt: string;
}

export interface NewMessage {
  roomId: string;
  sender: Sender;
  kind: MessageKind;
  body?: string | null;
  audioPath?: string | null;
  imagePath?: string | null;
  durationS?: number | null;
  effect?: 'surprise' | null;
  deliverAt?: string;
}

export interface NewRoom {
  childTokenHash: string;
  parentTokenHash: string;
  childName: string;
  characterId: string;
  creatorHash: string;
  expiresAt: string;
}

/**
 * Puerto de persistencia de la mensajería. Implementaciones:
 *  - SupabaseRoomStore (producción)
 *  - MemoryRoomStore (solo desarrollo/tests, nunca en producción)
 * Las implementaciones lanzan RoomError('RATE_LIMITED') cuando toca.
 */
export interface RoomStore {
  insertRoom(room: NewRoom): Promise<void>;
  /** Devuelve null si no existe o ha caducado. */
  findRoomByTokenHash(hash: string): Promise<RoomRecord | null>;
  insertMessage(message: NewMessage): Promise<MessageRecord>;
  listMessages(roomId: string, opts: { deliveredOnly: boolean }): Promise<MessageRecord[]>;
  countSystemMessagesSince(roomId: string, sinceIso: string): Promise<number>;
  /** Respuestas con voz del personaje en esa sala desde `sinceIso` (tope por sala). */
  countVoiceRepliesSince(roomId: string, sinceIso: string): Promise<number>;
  /** Caracteres sintetizados en toda la app desde `sinceIso` (tope de coste diario). */
  sumVoiceCharsSince(sinceIso: string): Promise<number>;
  uploadFile(bucket: Bucket, path: string, data: Buffer, contentType: string): Promise<void>;
  signedUrls(bucket: Bucket, paths: string[]): Promise<Map<string, string>>;
  /** Borra salas caducadas (y sus mensajes y archivos). */
  deleteExpired(nowIso: string): Promise<{ rooms: number; files: number }>;
}
