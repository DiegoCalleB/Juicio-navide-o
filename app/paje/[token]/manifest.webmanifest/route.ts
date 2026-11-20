import { NextResponse, type NextRequest } from 'next/server';
import { BRAND_ICONS, manifestResponse } from '@/lib/pwa';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Panel de los padres instalable: abre directamente el panel de esa sala. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // Nombre neutro: el icono en la pantalla de inicio no debe decir de qué peque es.
  const found = await findRoomByToken(token, { allowLocked: true });
  if (!found || found.role !== 'parent') return new NextResponse('No encontrado', { status: 404 });
  return manifestResponse({
    name: 'Panel de los padres · Línea Mágica',
    shortName: 'Padres',
    description: 'Panel secreto de los padres',
    path: `/paje/${token}`,
    icons: BRAND_ICONS,
    themeColor: '#0a1220',
  });
}
