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

function required(name: string, minLength: number): string {
  const v = process.env[name];
  if (!v || v.length < minLength) throw new Error(`Variable de entorno ausente o inválida: ${name}.`);
  return v;
}

/** Clave secreta de Supabase (solo servidor). Nunca con prefijo NEXT_PUBLIC_. */
export const getSupabaseSecretKey = () => required('SUPABASE_SECRET_KEY', 20);

/** Clave de ElevenLabs (solo servidor). Solo hace falta si la voz está activada. */
export const getElevenLabsKey = () => required('ELEVENLABS_API_KEY', 10);

/** Secreto del endpoint de limpieza (lo llama un programador externo). */
export function getCronSecret(): string | null {
  const v = process.env.CRON_SECRET;
  return v && v.length >= 16 ? v : null;
}
