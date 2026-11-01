import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { clientEnv } from '@/lib/env';
import type { Database } from '@/types/database';

let instance: SupabaseClient<Database> | undefined;

/** Cliente de navegador (solo anon key, sujeto a RLS). Sin sesión: no hay auth. */
export function getBrowserClient(): SupabaseClient<Database> {
  instance ??= createClient<Database>(clientEnv.NEXT_PUBLIC_SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return instance;
}
