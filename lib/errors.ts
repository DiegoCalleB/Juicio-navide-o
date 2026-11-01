import type { AppError, ErrorCode } from '@/types';

const MESSAGES: Record<ErrorCode, string> = {
  VALIDATION: 'Revisa los campos marcados.',
  RATE_LIMITED: 'Demasiado rápido, jurado. Espera un momento.',
  DUPLICATE: 'Ya firmaste este juicio.',
  NOT_FOUND: 'Este juicio no existe.',
  SPAM: 'Solicitud rechazada.',
  UNKNOWN: 'El tribunal ha tenido un problema. Inténtalo de nuevo.',
};

export function appError(code: ErrorCode, fieldErrors?: Record<string, string[]>): AppError {
  return fieldErrors ? { code, message: MESSAGES[code], fieldErrors } : { code, message: MESSAGES[code] };
}
