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
  /** ¿Lee ya el niño? 'yes' | 'learning' | 'no'. */
  readingLevel: string;
  /** Fin de la prueba gratuita (null = sin límite). */
  trialEndsAt: string | null;
  /** Pase de Navidad que desbloquea la sala (null = sin pase). */
  passId: string | null;
  /** Variante de idioma: 'es' o 'es-419'. */
  locale: string;
  /** Huella del enlace de familia (null = sala sin familia). */
  familyHash: string | null;
  /** Dato interno para derivar el enlace de padres desde el de familia. */
  familySeed: string | null;
  /** Apodo de la familia (opcional). */
  familyName: string | null;
  /** Huella del PIN de los padres (null = sin PIN). */
  parentPin: string | null;
  /** Huella del código de rescate del PIN. */
  pinRecovery: string | null;
  expiresAt: string;
}

export interface PassRecord {
  id: string;
  kind: 'paid' | 'gift';
  stripeSessionId: string | null;
  parentPassId: string | null;
  roomsLimit: number;
  expiresAt: string;
}

export interface NewPass {
  tokenHash: string;
  kind: 'paid' | 'gift';
  stripeSessionId?: string | null;
  parentPassId?: string | null;
  amountCents?: number | null;
  expiresAt: string;
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
  readingLevel?: string;
  trialEndsAt?: string | null;
  passId?: string | null;
  locale?: string;
  familyHash?: string | null;
  familySeed?: string | null;
  familyName?: string | null;
  parentPin?: string | null;
  pinRecovery?: string | null;
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

  // ── Prueba gratuita y pases ──
  /** Salas de prueba (sin pase) creadas desde ese dispositivo/conexión desde `sinceIso`. */
  countTrialRoomsByCreatorSince(creatorHash: string, sinceIso: string): Promise<number>;
  /** Crea el pase; si ya existe uno con ese stripeSessionId, devuelve el existente (idempotente). */
  insertPass(pass: NewPass): Promise<PassRecord>;
  findPassByTokenHash(hash: string): Promise<PassRecord | null>;
  findPassById(id: string): Promise<PassRecord | null>;
  findPassByStripeSession(sessionId: string): Promise<PassRecord | null>;
  /** El pase regalado por otro pase (si existe). */
  findGiftOf(passId: string): Promise<PassRecord | null>;
  countRoomsByPass(passId: string): Promise<number>;
  /** Asocia un pase a la sala (quita el límite de la prueba) y, si tiene familia, a las demás salas de la familia sin pase. */
  attachPass(roomId: string, passId: string): Promise<boolean>;
  /** Salas vigentes de una familia, de la más antigua a la más reciente. */
  listRoomsByFamilyHash(hash: string): Promise<RoomRecord[]>;
  /** Pone, cambia o quita el PIN (y su código de rescate): en todas las salas de la familia, o solo en la sala si no tiene. */
  setPin(scope: { roomId: string; familyHash: string | null }, pin: string | null, recovery: string | null): Promise<void>;
  /** Cambia el apodo de todas las salas de la familia. */
  updateFamilyName(hash: string, name: string | null): Promise<void>;
  /** Cambia el nivel de lectura de la sala. */
  updateReadingLevel(roomId: string, level: string): Promise<boolean>;
}
