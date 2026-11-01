import { compressToWebp } from '@/lib/image';
import { getBrowserClient } from '@/lib/supabase/client';
import { clientEnv } from '@/lib/env';

export const EVIDENCE_BUCKET = 'evidence';

export function photoPublicUrl(path: string): string {
  return `${clientEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${EVIDENCE_BUCKET}/${path}`;
}

/** Comprime en cliente y sube. Devuelve el path (uuid.webp). */
export async function uploadEvidence(file: File): Promise<string> {
  const blob = await compressToWebp(file);
  const path = `${crypto.randomUUID()}.webp`;
  const { error } = await getBrowserClient()
    .storage.from(EVIDENCE_BUCKET)
    .upload(path, blob, { contentType: 'image/webp', upsert: false, cacheControl: '31536000' });
  if (error) throw new Error('No se pudo subir la foto.');
  return path;
}
