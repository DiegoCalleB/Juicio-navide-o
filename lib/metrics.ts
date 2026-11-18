import 'server-only';
import { clientIp } from '@/lib/clientIp';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { after } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getServerEnv } from '@/lib/env.server';
import { isMemoryStore } from '@/services/room-store';

/**
 * Métricas propias: sin cookies, sin scripts en el navegador y sin terceros. Cada evento suma a un contador
 * por día (hora de Madrid), evento y origen. Para contar personas distintas se usa un hash que cambia cada día
 * (IP + navegador + día + sal): no sirve para seguir a nadie de un día a otro y no se guarda ningún dato personal.
 * Nunca rompe una página: si falla, no pasa nada.
 */
export const EVENTS = [
  'landing', // visitas a la portada
  'landing_nueva', // …de quien aún no ha contestado a Chispa
  'edad_mayor', // contesta 18 o más
  'edad_menor', // contesta menos de 18
  'mayores_edad', // llega a /mayores y ve la pregunta de Chispa
  'mayores_puerta', // ve la cuenta de cabeza
  'puerta_ok', // la acierta
  'puerta_fallo', // la falla
  'puerta_bloqueo', // queda bloqueado por fallar
  'mayores_cuenta', // entra a la zona de mayores
  'crear_vista', // ve «Abre el portal»
  'precios_vista', // ve los precios
  'diario_vista', // diario de Chispa
  'polo_norte_vista', // rincón del Polo Norte
  'portal_nino', // un peque abre su portal
] as const;
export type MetricEvent = (typeof EVENTS)[number];

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|meta-externalagent|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|node-fetch|axios|go-http|java\/|okhttp|whatsapp|telegram|slack|discord|twitter|linkedin/i;

/** Madrid, formato YYYY-MM-DD. */
export function madridDay(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

const SOURCES: [RegExp, string][] = [
  [/facebook\.com|fb\.com|fb\.me/, 'fb'],
  [/instagram\.com/, 'ig'],
  [/tiktok\.com/, 'tt'],
  [/youtube\.com|youtu\.be/, 'yt'],
  [/google\./, 'google'],
  [/bing\.com|duckduckgo\.com|ecosia\./, 'buscador'],
  [/wa\.me|whatsapp\.com/, 'wa'],
  [/linkedin\.com|lnkd\.in/, 'li'],
  [/^t\.co$|twitter\.com|(^|\.)x\.com$/, 'x'],
];

/** Origen de la visita: ?src= (enlaces propios) o, si no, el sitio del que viene. */
export function sourceOf(srcParam: string | null | undefined, referer: string | null | undefined): string {
  const p = (srcParam ?? '').toLowerCase();
  if (/^[a-z0-9_]{1,20}$/.test(p)) return p;
  if (referer) {
    try {
      const host = new URL(referer).hostname;
      for (const [re, name] of SOURCES) if (re.test(host)) return name;
      return 'otra_web';
    } catch { /* referer raro */ }
  }
  return 'directo';
}

interface MemRow { total: number; uniq: number }
const mem = (): Map<string, MemRow> => {
  const g = globalThis as unknown as { __metricsMem?: Map<string, MemRow>; __metricsSeen?: Set<string> };
  return (g.__metricsMem ??= new Map());
};
const memSeen = (): Set<string> => {
  const g = globalThis as unknown as { __metricsSeen?: Set<string> };
  return (g.__metricsSeen ??= new Set());
};

async function bump(day: string, event: MetricEvent, src: string, visitor: string): Promise<void> {
  if (isMemoryStore()) {
    const key = `${day}|${event}|${src}`;
    const r = mem().get(key) ?? { total: 0, uniq: 0 };
    r.total += 1;
    const seenKey = `${day}|${event}|${visitor}`;
    if (!memSeen().has(seenKey)) { memSeen().add(seenKey); r.uniq += 1; }
    mem().set(key, r);
    return;
  }
  const { error } = await getAdminClient().rpc('metrics_bump', { p_day: day, p_event: event, p_src: src, p_visitor: visitor });
  if (error) console.error('[metrics]', error.message);
}

/** Apunta un evento (en segundo plano). `src` solo se pasa en las visitas de entrada. */
export async function track(event: MetricEvent, opts: { src?: string | null } = {}): Promise<void> {
  try {
    const h = await headers();
    const ua = h.get('user-agent') ?? '';
    if (!isMemoryStore() && (!ua || BOT.test(ua))) return;
    if (h.get('next-router-prefetch') || h.get('purpose') === 'prefetch' || h.get('sec-purpose')?.includes('prefetch')) return;
    const day = madridDay();
    const ip = clientIp(h);
    const visitor = createHash('sha256').update(`${getServerEnv().FINGERPRINT_SALT}|m|${day}|${ip}|${ua}`).digest('hex').slice(0, 32);
    const src = opts.src === undefined || opts.src === null ? sourceOf(null, h.get('referer')) : opts.src;
    after(() => bump(day, event, src, visitor).catch((e) => console.error('[metrics]', e)));
  } catch (e) {
    console.error('[metrics]', e);
  }
}

/** Atajo para páginas de entrada: origen por ?src= o por la web de la que viene. */
export async function trackEntry(event: MetricEvent, srcParam?: string | null): Promise<void> {
  try {
    const h = await headers();
    await track(event, { src: sourceOf(srcParam, h.get('referer')) });
  } catch { /* nunca rompe */ }
}

export interface MetricRow { day: string; event: string; src: string; total: number; uniq: number }

/** Todas las filas desde `fromDay` (incluido). */
export async function readMetrics(fromDay: string): Promise<MetricRow[]> {
  if (isMemoryStore()) {
    const out: MetricRow[] = [];
    for (const [k, v] of mem()) {
      const [day, event, src] = k.split('|') as [string, string, string];
      if (day >= fromDay) out.push({ day, event, src, total: v.total, uniq: v.uniq });
    }
    return out;
  }
  const rows: MetricRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await getAdminClient().from('metrics_daily').select('day,event,src,total,uniq').gte('day', fromDay).range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data as MetricRow[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

/** Borra los hashes de visitantes de días anteriores (se llama desde la limpieza diaria). */
export async function purgeSeen(): Promise<void> {
  if (isMemoryStore()) return;
  const { error } = await getAdminClient().rpc('metrics_purge_seen');
  if (error) console.error('[metrics purge]', error.message);
}

/** Cosas que ya guarda la base de datos: portales abiertos y pases, por día de Madrid. */
export async function readBusiness(fromDay: string): Promise<{ portales: Record<string, number>; pases: Record<string, number>; ingresos: number }> {
  const portales: Record<string, number> = {};
  const pases: Record<string, number> = {};
  let ingresos = 0;
  if (isMemoryStore()) return { portales, pases, ingresos };
  const db = getAdminClient();
  const from = `${fromDay}T00:00:00+02:00`;
  const r = await db.from('rooms').select('created_at').gte('created_at', from).limit(5000);
  for (const x of r.data ?? []) { const d = madridDay(new Date(x.created_at as string)); portales[d] = (portales[d] ?? 0) + 1; }
  const p = await db.from('passes').select('created_at,kind,amount_cents').eq('kind', 'paid').gte('created_at', from).limit(5000);
  for (const x of p.data ?? []) {
    const d = madridDay(new Date(x.created_at as string));
    pases[d] = (pases[d] ?? 0) + 1;
    ingresos += (x.amount_cents as number | null) ?? 0;
  }
  return { portales, pases, ingresos };
}
