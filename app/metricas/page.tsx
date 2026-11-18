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

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)} %` : '—');
const money = (cents: number) => `${(cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

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
  const mayores = sum('edad_mayor', 'uniq');
  const menores = sum('edad_menor', 'uniq');
  const funnel: [string, number, string][] = [
    ['Visitan la portada', visitas, 'personas distintas por día'],
    ['Contestan a Chispa (edad)', contestan, ''],
    ['Dicen 18 o más', mayores, ''],
    ['Entran a «Mi cuenta» y ven la cuenta de cabeza', sum('mayores_puerta', 'uniq'), 'incluye a quien llega con el enlace directo'],
    ['Aciertan la cuenta', sum('puerta_ok', 'uniq'), ''],
    ['Ven «Abre el portal»', sum('crear_vista', 'uniq'), ''],
    ['Portales abiertos', sumBiz(biz.portales), 'de la base de datos'],
    ['Pases de pago', sumBiz(biz.pases), 'de la base de datos'],
  ];

  const bySrc = new Map<string, { total: number; uniq: number; mayor: number }>();
  for (const r of rows) {
    if (r.event !== 'landing' && r.event !== 'edad_mayor') continue;
    const s = bySrc.get(r.src) ?? { total: 0, uniq: 0, mayor: 0 };
    if (r.event === 'landing') { s.total += r.total; s.uniq += r.uniq; } else s.mayor += r.uniq;
    bySrc.set(r.src, s);
  }
  const srcRows = [...bySrc.entries()].sort((a, b) => b[1].uniq - a[1].uniq);

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
        <p className="mt-1 text-[12.5px] text-white/50">Del {from} al {today} (hora de Madrid). Sin cookies ni datos personales. «Personas» = visitantes distintos por día; si alguien vuelve otro día cuenta otra vez.</p>
        {problem && <p role="alert" className="mt-4 rounded-xl border border-[#ff9a9a]/40 bg-[#ff9a9a]/10 p-3 text-[13px]">No se han podido leer las métricas: {problem}</p>}

        <section aria-label="Resumen" className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card t="Visitas hoy" v={sum('landing', 'uniq', today)} s={`${sum('landing', 'total', today)} páginas vistas`} />
          <Card t="Visitas ayer" v={sum('landing', 'uniq', list[list.length - 2] ?? today)} />
          <Card t={`Visitas ${days} días`} v={visitas} s={`${sum('landing', 'total')} páginas vistas`} />
          <Card t="Mayores / menores" v={`${mayores} / ${menores}`} s={`${pct(mayores, contestan)} dicen 18 o más`} />
          <Card t="Cuenta acertada" v={sum('puerta_ok', 'uniq')} s={`${sum('puerta_fallo', 'total')} fallos · ${sum('puerta_bloqueo', 'total')} bloqueos`} />
          <Card t="Portales abiertos" v={sumBiz(biz.portales)} s={`hoy: ${sumBiz(biz.portales, today)}`} />
          <Card t="Pases de pago" v={sumBiz(biz.pases)} s={money(biz.ingresos)} />
          <Card t="Peques en su portal" v={sum('portal_nino', 'uniq')} s="aperturas distintas por día" />
        </section>

        <section aria-label="Embudo" className="mt-8">
          <h2 className="mb-2 text-[18px] font-semibold">Del primer vistazo al Pase</h2>
          <ol className="space-y-1.5">
            {funnel.map(([label, n, note], i) => (
              <li key={label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2.5">
                <span className="text-[14px]">{label}{note && <span className="block text-[11.5px] text-white/45">{note}</span>}</span>
                <span className="text-[18px] font-bold tabular-nums">{n}</span>
                <span className="w-14 text-right text-[12.5px] tabular-nums text-white/55">{i === 0 ? '' : pct(n, funnel[i - 1]![1])}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Origen" className="mt-8">
          <h2 className="mb-2 text-[18px] font-semibold">De dónde llegan</h2>
          {srcRows.length === 0 ? (
            <p className="text-[13px] text-white/50">Aún no hay visitas en este periodo.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-[13.5px]">
                <thead className="bg-white/[.05] text-left text-white/60"><tr><th className="px-3 py-2">Origen</th><th className="px-3 py-2">Personas</th><th className="px-3 py-2">Páginas vistas</th><th className="px-3 py-2">Dicen 18+</th></tr></thead>
                <tbody>
                  {srcRows.map(([s, v]) => (
                    <tr key={s} className="border-t border-white/10"><td className="px-3 py-2">{SRC_NAMES[s] ?? s}</td><td className="px-3 py-2 tabular-nums">{v.uniq}</td><td className="px-3 py-2 tabular-nums">{v.total}</td><td className="px-3 py-2 tabular-nums">{v.mayor}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-label="Por día" className="mt-8">
          <h2 className="mb-2 text-[18px] font-semibold">Día a día</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead className="bg-white/[.05] text-left text-white/60">
                <tr><th className="px-3 py-2">Día</th><th className="px-3 py-2">Visitas</th><th className="px-3 py-2"> </th><th className="px-3 py-2">18+</th><th className="px-3 py-2">&lt;18</th><th className="px-3 py-2">Cuenta ok</th><th className="px-3 py-2">Fallos</th><th className="px-3 py-2">Portales</th><th className="px-3 py-2">Pases</th></tr>
              </thead>
              <tbody>
                {[...list].reverse().map((d) => {
                  const v = sum('landing', 'uniq', d);
                  return (
                    <tr key={d} className="border-t border-white/10">
                      <td className="px-3 py-1.5 tabular-nums">{d.slice(5)}</td>
                      <td className="px-3 py-1.5 tabular-nums">{v}</td>
                      <td className="w-28 px-3 py-1.5"><div aria-hidden className="h-2 rounded bg-[#f6d77a]" style={{ width: `${Math.max(v ? 4 : 0, (v / maxDay) * 100)}%` }} /></td>
                      <td className="px-3 py-1.5 tabular-nums">{sum('edad_mayor', 'uniq', d)}</td>
                      <td className="px-3 py-1.5 tabular-nums">{sum('edad_menor', 'uniq', d)}</td>
                      <td className="px-3 py-1.5 tabular-nums">{sum('puerta_ok', 'uniq', d)}</td>
                      <td className="px-3 py-1.5 tabular-nums">{sum('puerta_fallo', 'total', d)}</td>
                      <td className="px-3 py-1.5 tabular-nums">{sumBiz(biz.portales, d)}</td>
                      <td className="px-3 py-1.5 tabular-nums">{sumBiz(biz.pases, d)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-label="Otras páginas" className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card t="Diario de Chispa" v={sum('diario_vista', 'uniq')} />
          <Card t="Polo Norte" v={sum('polo_norte_vista', 'uniq')} />
          <Card t="Ven precios" v={sum('precios_vista', 'uniq')} />
          <Card t="Cuenta fallada y bloqueada" v={sum('puerta_bloqueo', 'total')} s="bloqueos de dispositivo o red" />
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
