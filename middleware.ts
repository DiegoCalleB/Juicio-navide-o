import { NextResponse, type NextRequest } from 'next/server';
import { GATE_COOKIE, gateEnabled, isAdultPath, newSession, sessionCookie, sessionValid } from '@/lib/adultGate';

/**
 * Portero de la zona de mayores (REGLA DE ORO, AGENTS.md): sin haber pasado la puerta, nada que explique
 * la magia llega a abrirse. Con la puerta pasada, cada visita alarga la sesión (caduca a los 30 min sin uso).
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!isAdultPath(pathname) || !gateEnabled()) return NextResponse.next();

  if (await sessionValid(req.cookies.get(GATE_COOKIE)?.value)) {
    const res = NextResponse.next();
    res.cookies.set(sessionCookie(await newSession()));
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }
  const url = req.nextUrl.clone();
  url.pathname = '/mayores';
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  const res = NextResponse.redirect(url);
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'private, no-store');
  res.headers.set('Referrer-Policy', 'no-referrer'); // ?next= puede llevar un enlace secreto
  return res;
}

export const config = {
  // Solo páginas (las API y los ficheros estáticos van por su cuenta).
  matcher: ['/crear', '/precios', '/ideas-elfo/:path*', '/familia/:path*', '/paje/:path*', '/pase/:path*', '/privacidad', '/terminos', '/demo/:path*'],
};
