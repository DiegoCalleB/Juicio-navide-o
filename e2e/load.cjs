#!/usr/bin/env node
/**
 * Prueba de carga del servidor (capa de aplicación, sin Supabase).
 *   node e2e/load.cjs [salas=500] [segundos=60] [intervaloMensajes=15]
 * Requiere `npm run build`. Arranca `next start` con el almacén en memoria,
 * abre 2 conexiones SSE por sala (niño y padres) y simula conversación real.
 */
const http = require('http');
const path = require('path');
const { spawn, execSync } = require('child_process');

const ROOMS = Number(process.argv[2] || 500);
const DURATION = Number(process.argv[3] || 60) * 1000;
const MSG_EVERY = Number(process.argv[4] || 15) * 1000;
const PORT = Number(process.env.LOAD_PORT || 3810);
const ROOT = path.join(__dirname, '..');
const agent = new http.Agent({ keepAlive: true, maxSockets: Infinity });

const env = {
  ...process.env, NODE_ENV: 'production', PORT: String(PORT), ROOMS_STORE: 'memory', ALLOW_MEMORY_STORE_FOR_LOAD_TEST: '1',
  FINGERPRINT_SALT: 'load-salt-load-salt-load-salt', NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'load-anon-key-load-anon-key',
};

const pct = (arr, p) => (arr.length ? [...arr].sort((a, b) => a - b)[Math.min(arr.length - 1, Math.floor((p / 100) * arr.length))] : NaN);
const fmt = (n) => (Number.isFinite(n) ? Math.round(n) + ' ms' : '–');

function request(method, p, ip, ua, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const t0 = performance.now();
    const req = http.request({ host: 'localhost', port: PORT, path: p, method, agent, headers: { 'x-forwarded-for': ip, 'user-agent': ua, ...(data ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } : {}) }, timeout: 15000 }, (res) => {
      let buf = ''; res.on('data', (c) => (buf += c)); res.on('end', () => resolve({ status: res.statusCode, body: buf, ms: performance.now() - t0 }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '', ms: 15000 }); });
    req.on('error', () => resolve({ status: 0, body: '', ms: performance.now() - t0 }));
    if (data) req.write(data);
    req.end();
  });
}

function openSse(token, ip, ua, onEvent) {
  const req = http.request({ host: 'localhost', port: PORT, path: `/api/rooms/${token}/events`, agent, headers: { accept: 'text/event-stream', 'x-forwarded-for': ip, 'user-agent': ua } }, (res) => {
    if (res.statusCode !== 200) { onEvent('error', res.statusCode); return; }
    let buf = '';
    res.on('data', (c) => {
      buf += c.toString();
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, i); buf = buf.slice(i + 2);
        const m = /event: (\w+)/.exec(block); if (m) onEvent(m[1]);
      }
    });
    res.on('close', () => onEvent('close'));
  });
  req.on('error', () => onEvent('error', 0));
  req.end();
  return req;
}

function serverStats(pids) {
  try {
    const out = execSync(`ps -o rss=,pcpu= -p ${pids.join(',')}`).toString().trim().split('\n');
    return out.reduce((a, l) => { const [r, c] = l.trim().split(/\s+/).map(Number); return { rssMb: a.rssMb + r / 1024, cpu: a.cpu + c }; }, { rssMb: 0, cpu: 0 });
  } catch { return { rssMb: 0, cpu: 0 }; }
}

(async () => {
  console.log(`Prueba de carga: ${ROOMS} salas (${ROOMS * 2} conexiones SSE), ${DURATION / 1000}s, un mensaje cada ${MSG_EVERY / 1000}s por sala\n`);
  const profArgs = process.env.LOAD_PROFILE ? ['--cpu-prof', `--cpu-prof-dir=${process.env.LOAD_PROFILE}`] : [];
  const server = spawn('node', [...profArgs, path.join(ROOT, 'node_modules/next/dist/bin/next'), 'start', '-p', String(PORT)], { env, cwd: ROOT, stdio: 'ignore' });
  const stop = () => { try { server.kill(process.env.LOAD_PROFILE ? 'SIGINT' : 'SIGKILL'); } catch {} };
  process.on('exit', stop); process.on('SIGINT', () => { stop(); process.exit(130); });
  for (let i = 0; i < 90; i++) { const r = await request('GET', '/privacidad', '1.1.1.1', 'warm'); if (r.status === 200) break; await new Promise((r) => setTimeout(r, 1000)); }

  const seed = await request('POST', '/api/dev-seed', '1.1.1.1', 'seed', { count: ROOMS });
  const rooms = JSON.parse(seed.body).rooms;
  console.log(`Salas creadas: ${rooms.length}`);

  const stats = { sseOpen: 0, sseErr: 0, sseClose: 0, posts: 0, polls: 0, unchanged: 0, http429: 0, httpErr: 0, timeouts: 0 };
  const notify = [], visible = [], pollMs = [], postMs = [];
  const waiters = new Map(); // roomIndex+side -> {t0, resolve}

  const clients = rooms.map((r, i) => {
    const ip = `10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`;
    const mk = (side, token) => {
      const c = { side, token, ip, ua: `load-${i}-${side}`, version: '', sse: null };
      c.sse = openSse(token, ip, c.ua, (ev, code) => {
        if (ev === 'ready') stats.sseOpen++;
        else if (ev === 'error') { stats.sseErr++; if (code === 429) stats.http429++; }
        else if (ev === 'close') stats.sseClose++;
        else if (ev === 'refresh') { const w = waiters.get(`${i}${side}`); if (w) { waiters.delete(`${i}${side}`); w.resolve(performance.now() - w.t0); } }
      });
      return c;
    };
    return { i, ip, child: mk('c', r.childToken), parent: mk('p', r.parentToken) };
  });
  await new Promise((r) => setTimeout(r, Math.min(15000, 3000 + ROOMS * 8)));
  console.log(`Conexiones SSE abiertas: ${stats.sseOpen}/${ROOMS * 2} (errores ${stats.sseErr})`);

  const pids = (() => { try { return execSync(`pgrep -f "next/dist/bin/next start -p ${PORT}|next-server"`).toString().trim().split('\n').map(Number).filter(Boolean); } catch { return [server.pid]; } })();
  const samples = []; const sampler = setInterval(() => samples.push(serverStats(pids)), 3000);
  const base = serverStats(pids);

  const account = (r) => { if (r.status === 429) stats.http429++; else if (r.status === 0) stats.timeouts++; else if (r.status >= 400) stats.httpErr++; };
  const waitFor = (key, ms) => new Promise((resolve) => { const t0 = performance.now(); waiters.set(key, { t0, resolve }); setTimeout(() => { if (waiters.get(key)) { waiters.delete(key); resolve(NaN); } }, ms); });

  async function fetchMessages(c) {
    const r = await request('GET', `/api/rooms/${c.token}/messages?v=${encodeURIComponent(c.version)}`, c.ip, c.ua);
    stats.polls++; pollMs.push(r.ms); account(r);
    try { const j = JSON.parse(r.body); if (j.ok) { if (j.data.unchanged) stats.unchanged++; c.version = j.data.version; } } catch {}
    return r;
  }

  const end = performance.now() + DURATION;
  const loops = clients.map(async (cl) => {
    await new Promise((r) => setTimeout(r, Math.random() * MSG_EVERY));
    // sondeo de respaldo (60 s con la conexión en directo activa) en paralelo
    const pollers = [cl.child, cl.parent].map(async (c) => { await new Promise((r) => setTimeout(r, Math.random() * 60000)); while (performance.now() < end) { await fetchMessages(c); await new Promise((r) => setTimeout(r, 60000)); } });
    while (performance.now() < end) {
      // el niño escribe → los padres reciben el aviso y piden los mensajes
      const wait = waitFor(`${cl.i}p`, 8000);
      const post = await request('POST', `/api/rooms/${cl.child.token}/message`, cl.ip, cl.child.ua, { text: `hola ${Math.random()}` });
      stats.posts++; postMs.push(post.ms); account(post);
      const n = await wait; notify.push(n);
      const t1 = performance.now(); const got = await fetchMessages(cl.parent); if (!Number.isNaN(n)) visible.push(n + (performance.now() - t1));
      await new Promise((r) => setTimeout(r, 1000));
      // los padres contestan → el niño recibe
      const wait2 = waitFor(`${cl.i}c`, 8000);
      const rep = await request('POST', `/api/rooms/${cl.parent.token}/reply`, cl.ip, cl.parent.ua, { text: 'Jo, jo, jo', delayMinutes: 0, mode: 'text' });
      stats.posts++; postMs.push(rep.ms); account(rep);
      const n2 = await wait2; notify.push(n2);
      const t2 = performance.now(); await fetchMessages(cl.child); if (!Number.isNaN(n2)) visible.push(n2 + (performance.now() - t2));
      await new Promise((r) => setTimeout(r, MSG_EVERY));
    }
    await Promise.all(pollers);
  });
  await Promise.all(loops);
  clearInterval(sampler);

  const okNotify = notify.filter(Number.isFinite);
  const lost = notify.length - okNotify.length;
  const peak = samples.reduce((a, s) => ({ rssMb: Math.max(a.rssMb, s.rssMb), cpu: Math.max(a.cpu, s.cpu) }), { rssMb: 0, cpu: 0 });
  const avgCpu = samples.length ? samples.reduce((a, s) => a + s.cpu, 0) / samples.length : 0;
  console.log('\n──────── RESULTADOS ────────');
  console.log(`Salas: ${ROOMS} · SSE abiertas: ${stats.sseOpen} · caídas: ${stats.sseClose} · errores SSE: ${stats.sseErr}`);
  console.log(`Mensajes enviados: ${stats.posts} · sondeos: ${stats.polls} (${stats.unchanged} "sin cambios" = ${Math.round((100 * stats.unchanged) / Math.max(1, stats.polls))}%)`);
  console.log(`Aviso en directo (POST → evento SSE):   p50 ${fmt(pct(okNotify, 50))} · p95 ${fmt(pct(okNotify, 95))} · p99 ${fmt(pct(okNotify, 99))} · máx ${fmt(Math.max(...okNotify))}`);
  console.log(`Mensaje visible (POST → leído):         p50 ${fmt(pct(visible, 50))} · p95 ${fmt(pct(visible, 95))} · p99 ${fmt(pct(visible, 99))}`);
  console.log(`Respuesta del servidor — POST:          p50 ${fmt(pct(postMs, 50))} · p95 ${fmt(pct(postMs, 95))} · GET sondeo: p50 ${fmt(pct(pollMs, 50))} · p95 ${fmt(pct(pollMs, 95))}`);
  console.log(`Avisos perdidos (sin llegar en 8 s): ${lost} · HTTP 429: ${stats.http429} · otros errores HTTP: ${stats.httpErr} · timeouts: ${stats.timeouts}`);
  console.log(`Servidor: memoria base ${Math.round(base.rssMb)} MB → pico ${Math.round(peak.rssMb)} MB · CPU media ${Math.round(avgCpu)}% (pico ${Math.round(peak.cpu)}%) [una sola réplica; el generador de carga comparte máquina]`);
  const pass = lost === 0 && stats.http429 === 0 && stats.httpErr === 0 && stats.timeouts === 0 && stats.sseErr === 0 && pct(okNotify, 95) < 1500;
  console.log(pass ? '\n✓ Carga superada' : '\n✗ Hay problemas (ver arriba)');
  clients.forEach((c) => { c.child.sse.destroy(); c.parent.sse.destroy(); });
  stop(); process.exit(pass ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
