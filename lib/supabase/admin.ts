import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { clientEnv } from '@/lib/env';
import { getSupabaseSecretKey } from '@/lib/env.server';

let admin: SupabaseClient | undefined;

/**
 * Cliente con clave secreta: salta RLS. Uso exclusivo en servidor y SIEMPRE
 * después de validar el token de capacidad de la sala.
 */
export function getAdminClient(): SupabaseClient {
  admin ??= createClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, getSupabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
