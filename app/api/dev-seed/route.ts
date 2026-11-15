import type { NextRequest } from 'next/server';
import { createRoom } from '@/services/rooms';
import { isMemoryStore } from '@/services/room-store';

export const dynamic = 'force-dynamic';

/** Crea salas de prueba en bloque. SOLO con el almacén en memoria (tests y pruebas de carga); si no, 404. */
export async function POST(req: NextRequest) {
  if (!isMemoryStore()) return new Response('Not found', { status: 404 });
  const { count = 10 } = (await req.json().catch(() => ({}))) as { count?: number };
  const n = Math.min(Math.max(Math.floor(Number(count)) || 1, 1), 5000);
  const rooms = [];
  for (let i = 0; i < n; i++) {
    const t = await createRoom({ childName: `Niño${i}`, characterId: i % 2 === 0 ? 'papa_noel' : 'melchor' }, 'f'.repeat(64));
    rooms.push(t);
  }
  return Response.json({ ok: true, rooms });
}
