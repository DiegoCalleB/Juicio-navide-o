/**
 * Registro de eventos de seguridad (REGLA: nunca datos de niños, ni IP, ni enlaces secretos).
 * Una línea JSON por evento con la marca «[security]»: en Railway se filtra con `[security]` y se puede
 * enlazar a un servicio de alertas. Sin imports de Node: vale también para el middleware (edge).
 */
const redact = (s: string) => s.replace(/[A-Za-z0-9_-]{43}/g, ':token').slice(0, 120);

export function secEvent(event: string, detail: Record<string, string | number | boolean | null | undefined> = {}): void {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(detail)) safe[k] = typeof v === 'string' ? redact(v) : v;
  console.warn('[security]', JSON.stringify({ event, ...safe }));
}
