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

/** Credenciales de la Mensajería Real (solo servidor). Nunca con prefijo NEXT_PUBLIC_. */
export function getRoyalEnv(): { SUPABASE_SECRET_KEY: string; ELEVENLABS_API_KEY: string } {
  const parsed = z
    .object({ SUPABASE_SECRET_KEY: z.string().min(20), ELEVENLABS_API_KEY: z.string().min(10) })
    .safeParse({
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    });
  if (!parsed.success) {
    const bad = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Variables de entorno ausentes para la Mensajería Real: ${bad}.`);
  }
  return parsed.data;
}

/** Secreto del endpoint de limpieza (lo llama un programador externo). */
export function getCronSecret(): string | null {
  const v = process.env.CRON_SECRET;
  return v && v.length >= 16 ? v : null;
}
