import 'server-only';
import { z } from 'zod';

const parsed = z.object({ FINGERPRINT_SALT: z.string().min(16) }).safeParse({
  FINGERPRINT_SALT: process.env.FINGERPRINT_SALT,
});

if (!parsed.success) {
  throw new Error('Variable de entorno inválida o ausente: FINGERPRINT_SALT (mínimo 16 caracteres).');
}

export const serverEnv = parsed.data;
