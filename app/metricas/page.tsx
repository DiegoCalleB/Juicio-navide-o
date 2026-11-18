import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { cookieValid, METRICS_COOKIE, metricsToken } from '@/lib/metricsAuth';
import { madridDay, readBusiness, readMetrics, type MetricRow } from '@/lib/metrics';
import { getSiteUrl } from '@/lib/site';
import { MetricasLogin } from './Login';
import { MetricasLogout } from './Logout';

export const dynamic = 'force-dynamic';
export const viewport: Viewport = { themeColor: '#0f1420' };
export const metadata: Metadata = { title: 'Métricas', robots: { index: false, follow: false } };

const SRC_NAMES: Record<string, string> = { fb: 'Facebook', ig: 'Instagram', tt: 'TikTok', yt: 'YouTube', wa: 'WhatsApp', x: 'X', li: 'LinkedIn', google: 'Google', buscador: 'Otro buscador', otra_web: 'Otra web', directo: 'Directo / sin origen', web: 'Dentro de la web' };


export default async function MetricasPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  if (!metricsToken()) notFound();
  if (!cookieValid((await cookies()).get(METRICS_COOKIE)?.value)) {
    return <div className="fixed inset-0 z-40 overflow-y-auto bg-[#0f1420] text-white"><MetricasLogin /></div>;
  }

  const q = Number((await searchParams).dias);
  const days = [7, 14, 30, 60].includes(q) ? q : 14;
  const list = Array.from({ length: days }, (_, i) => madridDay(new Date(Date.now() - (days - 1 - i) * 86_400_000)));
  const from = list[0]!;
  const today = list[list.length - 1]!;

  let rows: MetricRow[] = [];
  let biz = { portales: {} as Record<string, number>, pases: {} as Record<string, number>, ingresos: 0 };
  let problem = '';
  try {
    [rows, biz] = await Promise.all([readMetrics(from), readBusiness(from)]);
  } catch (e) {
    problem = e instanceof Error ? e.message : 'Error leyendo las métricas';
  }

  const sum = (event: string, f: 'total' | 'uniq', day?: string) =>
    rows.filter((r) => r.event === event && (!day || r.day === day)).reduce((n, r) => n + r[f], 0);
  const sumBiz = (m: Record<string, number>, day?: string) => (day ? m[day] ?? 0 : Object.values(m).reduce((a, b) => a + b, 0));

  const visitas = sum('landing', 'uniq');
  const contestan = sum('edad_mayor', 'uniq') + sum('edad_menor', 'uniq');
  const funnel: [string, number][] = [
    ['Han entrado', visitas],
    ['Han contestado a Chispa', contestan],
    ['Han pulsado «Mi cuenta»', sum('mayores_cuenta', 'uniq')],
    ['Han entrado en su cuenta', sum('puerta_ok', 'uniq')],
    ['Han creado un portal', sumBiz(biz.portales)],
    ['Han comprado el Pase', sumBiz(biz.pases)],
  ];

  const bySrc = new Map<string, { total: number; hoy: number }>();
  for (const r of rows) {
    if (r.event !== 'landing') continue;
    const s = bySrc.get(r.src) ?? { total: 0, hoy: 0 };
    s.total += r.total;
    if (r.day === today) s.hoy += r.total;
    bySrc.set(r.src, s);
  }
  const srcRows = [...bySrc.entries()].sort((a, b) => b[1].total - a[1].total);

  const maxDay = Math.max(1, ...list.map((d) => sum('landing', 'uniq', d)));
  const site = getSiteUrl();
  const links: [string, string][] = [['Facebook', 'fb'], ['Instagram (bio)', 'ig'], ['TikTok (bio)', 'tt'], ['LinkedIn', 'li'], ['YouTube', 'yt'], ['WhatsApp', 'wa']];

  const Card = ({ t, v, s }: { t: string; v: string | number; s?: string }) => (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
      <p className="text-[12px] uppercase tracking-wider text-white/50">{t}</p>
      <p className="mt-1 text-[28px] font-bold leading-none">{v}</p>
      {s && <p className="mt-1 text-[12px] text-white/50">{s}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#0f1420] text-[#eef2ff]">
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[24px] font-bold">Métricas</h1>
          <nav aria-label="Periodo" className="flex items-center gap-2 text-[13px]">
            {[7, 14, 30, 60].map((d) => (
              <a key={d} href={`/metricas?dias=${d}`} className={`rounded-full border px-3 py-1.5 ${d === days ? 'border-[#f6d77a] text-[#f6d77a]' : 'border-white/20 text-white/70'}`}>{d} días</a>
            ))}
            <MetricasLogout />
          </nav>
        </header>
        <p className="mt-1 text-[12.5px] text-white/50">Cada número es «personas»: si alguien entra dos veces el mismo día cuenta una. Hora de Madrid.</p>
        {problem && <p role="alert" className="mt-4 rounded-xl border border-[#ff9a9a]/40 bg-[#ff9a9a]/10 p-3 text-[13px]">No se han podido leer las métricas: {problem}</p>}

        <section aria-label="Hoy" className="mt-5">
          <h2 className="mb-2 text-[18px] font-semibold">Hoy</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card t="Han entrado" v={sum('landing', 'uniq', today)} />
            <Card t="Ayer entraron" v={sum('landing', 'uniq', list[list.length - 2] ?? today)} />
            <Card t="Han pulsado «Mi cuenta»" v={sum('mayores_cuenta', 'uniq', today)} />
            <Card t="Han creado un portal" v={sumBiz(biz.portales, today)} />
          </div>
        </section>

        <section aria-label="Origen" className="mt-8">
          <h2 className="mb-1 text-[18px] font-semibold">De dónde llegan</h2>
          <p className="mb-2 text-[12.5px] text-white/50">Entradas en los últimos {days} días. Hoy entre paréntesis.</p>
          {srcRows.length === 0 ? (
            <p className="text-[13px] text-white/50">Aún no hay visitas en este periodo.</p>
          ) : (
            <ul className="space-y-1.5">
              {srcRows.map(([s, v]) => (
                <li key={s} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.03] px-4 py-3">
                  <span className="text-[16px]">{SRC_NAMES[s] ?? s}</span>
                  <span className="text-[22px] font-bold tabular-nums">{v.total}<span className="ml-2 text-[13px] font-normal text-white/50">({v.hoy})</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Pasos" className="mt-8">
          <h2 className="mb-1 text-[18px] font-semibold">Qué hacen {days} días</h2>
          <ol className="space-y-1.5">
            {funnel.map(([label, n]) => (
              <li key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.03] px-4 py-3">
                <span className="text-[16px]">{label}</span>
                <span className="text-[22px] font-bold tabular-nums">{n}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Por día" className="mt-8">
          <h2 className="mb-2 text-[18px] font-semibold">Día a día</h2>
          <ul className="space-y-1">
            {[...list].reverse().map((d) => {
              const v = sum('landing', 'uniq', d);
              return (
                <li key={d} className="flex items-center gap-3 px-1 py-1 text-[15px]">
                  <span className="w-12 tabular-nums text-white/60">{d.slice(5)}</span>
                  <span className="w-8 text-right text-[17px] font-bold tabular-nums">{v}</span>
                  <span aria-hidden className="h-2 rounded bg-[#f6d77a]" style={{ width: `${Math.max(v ? 4 : 0, (v / maxDay) * 60)}%` }} />
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-label="Enlaces para redes" className="mt-8">
          <h2 className="mb-1 text-[18px] font-semibold">Enlaces con seguimiento</h2>
          <p className="mb-2 text-[12.5px] text-white/50">Pon cada uno en la bio o en el enlace de su red y aquí verás cuánta gente llega de cada sitio.</p>
          <ul className="space-y-1.5 text-[13.5px]">
            {links.map(([name, s]) => (
              <li key={s} className="flex flex-wrap gap-x-3 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2"><span className="w-32 text-white/60">{name}</span><code className="break-all select-all">{`${site}/?src=${s}`}</code></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
