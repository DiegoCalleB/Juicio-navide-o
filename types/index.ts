/** Tipos globales de dominio. */

export interface Trial {
  id: string;
  shortId: string;
  defendantName: string;
  charge: string;
  sentence: string;
  photoUrl: string | null;
  signatureCount: number;
  createdAt: string;
}

export interface Signature {
  id: string;
  signerName: string;
  createdAt: string;
}

export type ErrorCode =
  | 'VALIDATION'
  | 'RATE_LIMITED'
  | 'DUPLICATE'
  | 'NOT_FOUND'
  | 'SPAM'
  | 'UNKNOWN';

export interface AppError {
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: AppError };
