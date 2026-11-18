import { outbox } from '@/lib/mail';
import { isMemoryStore } from '@/services/room-store';

export const dynamic = 'force-dynamic';

/** Buzón y lista de correos de PRUEBA. Solo con almacén en memoria y MAIL_FAKE=1; si no, 404. */
export async function GET() {
  if (!isMemoryStore() || process.env.MAIL_FAKE !== '1') return new Response('Not found', { status: 404 });
  const { getRoomStore } = await import('@/services/room-store');
  return Response.json({ outbox: outbox(), contacts: await getRoomStore().listContacts() });
}
