import type { NextRequest } from 'next/server';
import { isMemoryStore } from '@/services/room-store';
import { readMemoryFile } from '@/services/room-store/memory';

export const dynamic = 'force-dynamic';

/** Sirve archivos del almacén en memoria. SOLO desarrollo/tests: en producción responde 404. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ bucket: string; path: string[] }> }) {
  if (!isMemoryStore()) return new Response('Not found', { status: 404 });
  const { bucket, path } = await params;
  const file = readMemoryFile(bucket, path.join('/'));
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(file.data), { headers: { 'Content-Type': file.contentType, 'Cache-Control': 'no-store' } });
}
