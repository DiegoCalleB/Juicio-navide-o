/**
 * IP del cliente detrás del proxy. El proxy AÑADE la IP real al final de `x-forwarded-for`; lo que venga antes
 * lo puede inventar el visitante, así que se toma la entrada del final (TRUSTED_PROXY_HOPS = proxies de confianza, por defecto 1).
 */
export function clientIp(h: { get(name: string): string | null }): string {
  const hops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS) || 1);
  const parts = (h.get('x-forwarded-for') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - hops] ?? parts[0] ?? h.get('x-real-ip') ?? 'unknown';
}
