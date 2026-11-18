import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { CONSENT_VERSION, unsubscribeUrl } from '@/lib/contacts';
import { fail, guarded, json } from '@/lib/http';
import { mailEnabled, sendMail } from '@/lib/mail';
import { savedLinkMail } from '@/lib/mailTemplates';
import { rateLimit } from '@/lib/security';
import { originFromHeaders } from '@/lib/site';
import { isUnlocked, resolveByToken } from '@/services/pin';
import { getRoomStore } from '@/services/room-store';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  email: z.string().trim().toLowerCase().max(120).email(),
  /** Consentimiento SEPARADO y expreso para novedades: la casilla nunca viene marcada. */
  marketing: z.boolean().optional(),
});

/** ¿Está activo el envío de correo? (la web oculta el formulario si no). */
export async function GET() {
  return json({ ok: true, data: { enabled: mailEnabled() } });
}

/**
 * Manda por correo el enlace guardado (el de la familia o el del panel, el que se esté usando) y, solo si la persona
 * lo acepta expresamente, la apunta para novedades. Nunca se confirma si el correo ya estaba guardado.
 */
export async function POST(req: NextRequest) {
  return guarded('correo', { key: 'correo', max: 6, windowMs: 60_000 }, async () => {
    if (!mailEnabled()) return fail('DISABLED', 'El envío por correo aún no está disponible.', 503);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail('VALIDATION', 'Escribe un correo válido.', 400);
    const { token, email, marketing } = parsed.data;

    const found = await resolveByToken(token);
    if (!found) return fail('NOT_FOUND', 'Enlace no encontrado', 404);
    // Con PIN, el panel tiene que estar abierto.
    if (found.rec.parentPin && !(await isUnlocked(found.scope))) return fail('NOT_FOUND', 'Enlace no encontrado', 404);

    // Frena el uso para molestar a un tercero: pocas veces al día por familia y por correo.
    if (!rateLimit(`correo:s:${found.scope}`, 3, 86_400_000) || !rateLimit(`correo:e:${email}`, 3, 86_400_000)) {
      return fail('RATE_LIMITED', 'Ya te lo hemos enviado. Revisa tu correo (y la carpeta de spam).', 429);
    }

    const origin = originFromHeaders(await headers());
    const link = `${origin}${found.viaParent ? '/paje/' : '/familia/'}${token}`;
    await getRoomStore().upsertContact({ scope: found.scope, email, marketing: marketing === true, consentVersion: CONSENT_VERSION });
    const unsub = marketing === true ? unsubscribeUrl(origin, email) : undefined;
    const ok = await sendMail({ to: email, ...savedLinkMail(link, unsub), unsubscribeUrl: unsub });
    if (!ok) return fail('UNKNOWN', 'No hemos podido enviarlo. Inténtalo de nuevo en un rato.', 502);
    return json({ ok: true, data: null });
  });
}
