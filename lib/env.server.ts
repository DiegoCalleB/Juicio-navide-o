import 'server-only';
import { z } from 'zod';

const schema = z.object({ FINGERPRINT_SALT: z.string().min(16) });

/** Lazy: no rompe la carga del módulo; falla con un mensaje claro al usarse. */
export function getServerEnv(): z.infer<typeof schema> {
  const parsed = schema.safeParse({ FINGERPRINT_SALT: process.env.FINGERPRINT_SALT });
  if (!parsed.success) {
    throw new Error('Variable de entorno inválida o ausente: FINGERPRINT_SALT (mínimo 16 caracteres).');
  }
  return parsed.data;
}
