import { NextResponse, type NextRequest } from 'next/server';
import { BRAND_ICONS, manifestResponse } from '@/lib/pwa';
import { familyLockState } from '@/services/pin';
import { getFamily } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** La familia instalable: un icono en el móvil que abre todas vuestras salas. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const state = await familyLockState(token);
  if (state === 'missing') return new NextResponse('No encontrado', { status: 404 });
  // Bloqueada: nombre genérico (el apodo de la familia no se enseña sin PIN).
  const family = state === 'open' ? await getFamily(token) : null;
  const label = family?.name ?? 'Mi familia';
  return manifestResponse({
    name: `${label} · Línea Mágica`,
    shortName: label.slice(0, 24),
    description: 'Todas las salas de vuestra familia',
    path: `/familia/${token}`,
    icons: BRAND_ICONS,
    themeColor: '#0a1220',
  });
}
