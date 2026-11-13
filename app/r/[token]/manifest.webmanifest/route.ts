import { NextResponse, type NextRequest } from 'next/server';
import { CHARACTERS, resolveCharacter } from '@/lib/characters';
import { characterIcons, manifestResponse } from '@/lib/pwa';
import { findRoomByToken } from '@/services/rooms';

export const dynamic = 'force-dynamic';

/** Al instalar la sala en el móvil del niño, la app se llama como el personaje, lleva su cara y abre su chat. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findRoomByToken(token);
  if (!found || found.role !== 'child') return new NextResponse('No encontrado', { status: 404 });
  const c = resolveCharacter(CHARACTERS[found.room.character], { alias: found.room.characterAlias, gender: found.room.characterGender, locale: found.room.locale });
  return manifestResponse({
    name: c.name,
    shortName: c.shortName,
    description: `Chat con ${c.name}`,
    path: `/r/${token}`,
    icons: characterIcons(found.room.character),
  });
}
