export type RoomErrorCode = 'RATE_LIMITED' | 'NOT_FOUND' | 'INVALID_FILE' | 'UNKNOWN';

export class RoomError extends Error {
  constructor(public readonly code: RoomErrorCode) {
    super(code);
  }
}
