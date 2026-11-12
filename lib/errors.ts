import type { AppError, ErrorCode } from '@/types';

const MESSAGES: Record<ErrorCode, string> = {
  VALIDATION: 'Revisa los campos marcados.',
  RATE_LIMITED: 'Demasiado rápido. Espera un momento y vuelve a intentarlo.',
  DUPLICATE: 'Esto ya estaba hecho.',
  NOT_FOUND: 'No lo encontramos.',
  SPAM: 'Solicitud rechazada.',
  TRIAL_USED: 'Ya has creado todas las salas de prueba gratis de este móvil. Con el Pase de Navidad puedes crear las que quieras.',
  UNKNOWN: 'Ha habido un problema. Inténtalo de nuevo.',
};

export function appError(code: ErrorCode, fieldErrors?: Record<string, string[]>): AppError {
  return fieldErrors ? { code, message: MESSAGES[code], fieldErrors } : { code, message: MESSAGES[code] };
}
