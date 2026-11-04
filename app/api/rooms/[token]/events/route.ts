import type { NextRequest } from 'next/server';
import { getClientFingerprint, rateLimit } from '@/lib/security';
import { fail } from '@/lib/http';
import { presenceEvent, subscribe, type RoomEvent } from '@/services/realtime';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_MS = 20_000;

/**
 * Canal de tiempo real (Server-Sent Events). Solo manda avisos ("refresh",
 * "typing"): el contenido se pide después por la API con el token.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const fp = await getClientFingerprint();
  if (!rateLimit(`all:${fp}`, 600, 60_000) || !rateLimit(`sse:${token}`, 40, 60_000)) {
    return fail('RATE_LIMITED', 'Demasiadas conexiones.', 429);
  }

  const found = await findRoomByToken(token);
  if (!found) return fail('NOT_FOUND', 'Sala no encontrada', 404);

  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          close();
        }
      };
      const onEvent = (e: RoomEvent) => send(`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`);

      const unsubscribe = subscribe(found.room.id, found.role, onEvent);
      if (!unsubscribe) {
        send('event: busy\ndata: {}\n\n');
        controller.close();
        return;
      }
      const heartbeat = setInterval(() => send(': ping\n\n'), HEARTBEAT_MS);

      function close() {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe?.();
        try {
          controller.close();
        } catch {
          /* ya cerrado */
        }
      }
      cleanup = close;
      req.signal.addEventListener('abort', close);
      send('retry: 3000\n\nevent: ready\ndata: {}\n\n');
      if (found.role === 'parent') onEvent(presenceEvent(found.room.id));
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
