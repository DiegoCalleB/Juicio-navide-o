export type Bucket = 'voices' | 'media';
export type Sender = 'child' | 'king' | 'system';
export type MessageKind = 'text' | 'voice' | 'photo';

export interface RoomRecord {
  id: string;
  childName: string;
  characterId: string;
  childTokenHash: string;
  parentTokenHash: string;
  /** Nombre que la familia le pone al personaje (solo el elfo). */
  characterAlias: string | null;
  /** 'm' o 'f' (solo el elfo). */
  characterGender: string | null;
  /** Cuántas veces se ha cambiado el enlace del niño (0 = nunca). */
  childLinkVersion: number;
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
  /** Última edición del texto (los padres); null si nunca se ha editado. */
  editedAt: string | null;
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
  characterAlias?: string | null;
  characterGender?: string | null;
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
  /**
   * Huella barata del estado de la sala. Cambia al llegar un mensaje o al vencer uno
   * diferido. Permite responder "sin cambios" sin listar ni firmar nada.
   */
  getRoomVersion(roomId: string, opts: { deliveredOnly: boolean }): Promise<string>;
  countSystemMessagesSince(roomId: string, sinceIso: string): Promise<number>;
  /** Sustituye el enlace del niño por otro nuevo (el anterior deja de funcionar). */
  updateChildLink(roomId: string, version: number, childTokenHash: string): Promise<boolean>;
  getMessage(roomId: string, messageId: string): Promise<MessageRecord | null>;
  /** Cambia el texto de un mensaje del personaje (texto o pie de foto). Devuelve la fila o null. */
  updateMessageBody(roomId: string, messageId: string, body: string | null, nowIso: string): Promise<MessageRecord | null>;
  /** Cambia el nombre y/o el personaje de la sala. */
  updateRoom(roomId: string, patch: { childName?: string; characterId?: string; characterAlias?: string | null; characterGender?: string | null }): Promise<boolean>;
  /** Rutas de todos los archivos de la sala (también de mensajes no entregados). */
  listFilePaths(roomId: string): Promise<{ bucket: Bucket; path: string }[]>;
  /** Borra la sala y sus mensajes (los archivos se borran antes con removeFile). */
  deleteRoom(roomId: string): Promise<void>;
  /** Borra cualquier mensaje de la sala (error de los padres). Devuelve la fila borrada para limpiar sus archivos, o null. */
  deleteMessage(roomId: string, messageId: string): Promise<MessageRecord | null>;
  /** Borra un archivo del almacén (sin error si no existe). */
  removeFile(bucket: Bucket, path: string): Promise<void>;
  /** Borra un mensaje del personaje que aún no se ha entregado (programado). Devuelve si existía. */
  deletePendingMessage(roomId: string, messageId: string, nowIso: string): Promise<boolean>;
  /** Respuestas con voz del personaje en esa sala desde `sinceIso` (tope por sala). */
  countVoiceRepliesSince(roomId: string, sinceIso: string): Promise<number>;
  /** Caracteres sintetizados en toda la app desde `sinceIso` (tope de coste diario). */
  sumVoiceCharsSince(sinceIso: string): Promise<number>;
  uploadFile(bucket: Bucket, path: string, data: Buffer, contentType: string): Promise<void>;
  signedUrls(bucket: Bucket, paths: string[]): Promise<Map<string, string>>;
  /** Borra salas caducadas (y sus mensajes y archivos). */
  deleteExpired(nowIso: string): Promise<{ rooms: number; files: number }>;
}
