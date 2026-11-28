import { NextResponse, type NextRequest } from 'next/server';
import { secEvent } from '@/lib/securityLog';
import { GATE_COOKIE, gateEnabled, isAdultPath, newSession, sessionCookie, sessionValid } from '@/lib/adultGate';

/**
 * Portero de la zona de mayores (REGLA DE ORO, AGENTS.md): sin haber pasado la puerta, nada que explique
 * la magia llega a abrirse. Con la puerta pasada, cada visita alarga la sesión (caduca a los 30 min sin uso).
 */
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
/** Los llama un servidor (Stripe, el programador de limpieza), no un navegador: no llevan Origin. */
const CSRF_EXEMPT = new Set(['/api/stripe/webhook', '/api/cron/cleanup']);

/**
 * Protección CSRF: una petición que cambia datos solo vale si viene de nuestra propia web.
 * El navegador marca siempre Sec-Fetch-Site y Origin, y una web ajena no puede falsificarlos.
 * Las peticiones sin ninguna de las dos cabeceras (curl, pruebas, servidores) no son de un navegador y pasan.
 */
function crossSite(req: NextRequest): boolean {
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return true;
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const o = new URL(origin).host;
    return o !== req.headers.get('host') && o !== req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  } catch {
    return true;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith('/api/')) {
    if (MUTATING.has(req.method) && !CSRF_EXEMPT.has(pathname) && crossSite(req)) {
      secEvent('csrf_bloqueado', { method: req.method, path: pathname });
      return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'No permitido.' } }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.next();
  }
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
  // Páginas de mayores (puerta) y API (comprobación de origen contra CSRF).
  matcher: ['/api/:path*', '/crear', '/precios', '/prueba', '/prueba/:path*', '/ideas-elfo/:path*', '/familia/:path*', '/paje/:path*', '/pase/:path*', '/privacidad', '/terminos', '/demo/:path*'],
};
