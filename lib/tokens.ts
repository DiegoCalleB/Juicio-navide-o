import 'server-only';
import { createHash, randomBytes } from 'node:crypto';

/** Token de capacidad: 256 bits, base64url (43 caracteres). */
export const TOKEN_REGEX = /^[A-Za-z0-9_-]{43}$/;

export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Token del niño derivado del de los padres (unidireccional): quien tiene el
 * enlace de padres puede reconstruir el del niño, nunca al revés.
 */
export function deriveChildToken(parentToken: string): string {
  return createHash('sha256').update(`royal-child:${parentToken}`).digest('base64url');
}
