import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

// Next solo inlinea referencias estáticas a process.env.NEXT_PUBLIC_*
const parsed = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const bad = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
  // Fail-fast: las NEXT_PUBLIC_* se incrustan en el build, deben existir al compilar.
  throw new Error(`Variables de entorno inválidas o ausentes: ${bad}. Defínelas antes del build.`);
}

export const clientEnv = parsed.data;
