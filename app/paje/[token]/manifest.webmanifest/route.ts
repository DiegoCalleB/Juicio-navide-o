import { NextResponse, type NextRequest } from 'next/server';
import { BRAND_ICONS, manifestResponse } from '@/lib/pwa';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Panel de los padres instalable: abre directamente el panel de esa sala. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findRoomByToken(token);
  if (!found || found.role !== 'parent') return new NextResponse('No encontrado', { status: 404 });
  return manifestResponse({
    name: `Panel de ${found.room.childName} · Línea Mágica`,
    shortName: `Panel de ${found.room.childName}`.slice(0, 24),
    description: 'Panel secreto de los padres',
    path: `/paje/${token}`,
    icons: BRAND_ICONS,
    themeColor: '#0a1220',
  });
}
