import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { clientEnv } from '@/lib/env';
import type { Database } from '@/types/database';

export function getServerClient(): SupabaseClient<Database> {
  return createClient<Database>(clientEnv.NEXT_PUBLIC_SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
