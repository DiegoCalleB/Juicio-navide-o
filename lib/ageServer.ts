import 'server-only';
import { cookies } from 'next/headers';
import { AGE_COOKIE, ageStatus, type AgeKind } from '@/lib/adultGate';

/** Lo que Chispa sabe de quien visita la web: 'ok' (dijo ser mayor), 'menor' o null (aún no ha contestado). */
export async function currentAge(): Promise<AgeKind | null> {
  return ageStatus((await cookies()).get(AGE_COOKIE)?.value);
}
