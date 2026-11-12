/**
 * Pase de Navidad guardado en ESTE móvil (solo navegador). Con él, las salas nuevas nacen sin límite
 * y una sala en prueba se desbloquea con un toque. Es un enlace secreto: no sale del móvil.
 */
const KEY = 'magic-pass';
const RETURN_KEY = 'magic-checkout-return';

export function loadPass(): string | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v && /^[A-Za-z0-9_-]{43}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

export function savePass(token: string): void {
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    /* sin almacenamiento */
  }
}

export function forgetPass(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* sin almacenamiento */
  }
}

/** Panel al que volver tras pagar (no se manda a Stripe: es un enlace secreto). */
export function setCheckoutReturn(path: string | null): void {
  try {
    if (path) window.sessionStorage.setItem(RETURN_KEY, path);
    else window.sessionStorage.removeItem(RETURN_KEY);
  } catch {
    /* sin almacenamiento */
  }
}

export function getCheckoutReturn(): string | null {
  try {
    const v = window.sessionStorage.getItem(RETURN_KEY);
    return v && v.startsWith('/paje/') ? v : null;
  } catch {
    return null;
  }
}

/** Abre el pago de Stripe. Devuelve un mensaje de error o nada (si redirige). */
export async function startCheckout(roomToken?: string): Promise<string | null> {
  setCheckoutReturn(roomToken ? `/paje/${roomToken}` : null);
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waiver: true, ...(roomToken ? { roomToken } : {}) }),
    });
    const json = (await res.json()) as { ok: boolean; data?: { url: string }; error?: { message: string } };
    if (!json.ok || !json.data) return json.error?.message ?? 'No se pudo abrir el pago.';
    window.location.href = json.data.url;
    return null;
  } catch {
    return 'No se pudo abrir el pago. Revisa la conexión.';
  }
}
