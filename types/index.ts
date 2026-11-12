/** Tipos globales de dominio. */

export type ErrorCode =
  | 'VALIDATION'
  | 'RATE_LIMITED'
  | 'DUPLICATE'
  | 'NOT_FOUND'
  | 'SPAM'
  | 'TRIAL_USED'
  | 'UNKNOWN';

export interface AppError {
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: AppError };
