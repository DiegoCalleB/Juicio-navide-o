// Métricas propias: el panel solo se abre con la clave del dueño, y cuenta visitas por origen, edades y la puerta
// sin cookies ni datos personales.
const { BASE, launch } = require('../_lib.cjs');
const results = [];
const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
const TOKEN = process.env.METRICS_TOKEN || 'clave-de-pruebas-1234';

(async () => {
  const b = await launch([], { adult: false });
  const owner = await b.newContext({ viewport: { width: 1000, height: 900 } });
  const p = await owner.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));

  // 1. Sin clave, solo el formulario; clave mala rechazada; clave buena abre el panel
  await p.goto(BASE + '/metricas', { waitUntil: 'networkidle' });
  check('sin clave solo se ve el formulario', (await p.locator('#k').count()) === 1 && !(await p.locator('body').innerText()).includes('Visitas'));
  const bad = await fetch(BASE + '/api/metricas/entrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'mala-mala-mala' }) });
  check('clave incorrecta → 401', bad.status === 401);
  for (let i = 0; i < 5; i++) { await p.fill('#k', TOKEN); if (await p.getByRole('button', { name: 'Entrar' }).isEnabled()) break; await p.waitForTimeout(300); }
  await p.getByRole('button', { name: 'Entrar' }).click();
  await p.getByRole('heading', { name: 'Métricas' }).waitFor({ timeout: 20000 });
  check('con la clave se abre el panel', true);
  const hdr = await owner.request.get(BASE + '/metricas');
  check('el panel no se indexa', (await hdr.text()).includes('noindex'));

  const num = async (label) => {
    await p.goto(BASE + '/metricas?dias=7', { waitUntil: 'networkidle' });
    const t = await p.locator('body').innerText();
    const m = t.replace(/\n+/g, ' ').match(new RegExp(label + '\\s+(\\d+)', 'i'));
    return m ? Number(m[1]) : NaN;
  };
  const ig = async () => { await p.goto(BASE + '/metricas?dias=7', { waitUntil: 'networkidle' }); const t = (await p.locator('body').innerText()).replace(/\n+/g, ' '); const m = t.match(/Instagram\s+(\d+)/i); return m ? Number(m[1]) : 0; };

  const tt = async () => { await p.goto(BASE + '/metricas?dias=7', { waitUntil: 'networkidle' }); const t = (await p.locator('body').innerText()).replace(/\n+/g, ' '); const m = t.match(/TikTok\s+(\d+)/i); return m ? Number(m[1]) : 0; };
  const v0 = await num('Han entrado');
  const ig0 = await ig();

  // 2. Un visitante (peque o no) llega desde Instagram; otro contesta la edad y pasa por la puerta
  const kid = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1', extraHTTPHeaders: { 'x-forwarded-for': `10.9.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}` } });
  const kp = await kid.newPage();
  await kp.goto(BASE + '/?src=ig', { waitUntil: 'networkidle' });
  await kp.waitForTimeout(1500);
  const v1 = await num('Han entrado');
  check('una visita nueva suma a «Han entrado» (Hoy)', v1 === v0 + 1, `${v0} → ${v1}`);
  const ig1 = await ig();
  check('el origen ?src=ig aparece como Instagram', ig1 === ig0 + 1, `${ig0} → ${ig1}`);

  // TikTok: el navegador interno de la app cuenta como TikTok aunque el enlace no lleve ?src=, y ?src=tt_<vídeo> se agrupa en TikTok
  const tt0 = await tt();
  const ttCtx = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36 musical_ly_2023 BytedanceWebview/d8a21c6', extraHTTPHeaders: { 'x-forwarded-for': `10.8.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}` } });
  const ttp = await ttCtx.newPage();
  await ttp.goto(BASE + '/', { waitUntil: 'networkidle' });
  await ttp.waitForTimeout(1500);
  const tt1 = await tt();
  check('el navegador interno de TikTok cuenta como TikTok sin ?src=', tt1 === tt0 + 1, `${tt0} → ${tt1}`);
  await ttp.goto(BASE + '/?src=tt_c19', { waitUntil: 'networkidle' });
  await ttp.waitForTimeout(1500);
  const tt2 = await tt();
  check('?src=tt_c19 suma a TikTok (agrupado por red)', tt2 === tt1 + 1, `${tt1} → ${tt2}`);
  await p.goto(BASE + '/metricas?dias=7', { waitUntil: 'networkidle' });
  check('el desglose por vídeo muestra c19', /c19:\s*\d+/.test(await p.locator('body').innerText()));

  const mm = async () => { await p.goto(BASE + '/metricas?dias=7', { waitUntil: 'networkidle' }); const t = (await p.locator('body').innerText()).replace(/\n+/g, ' '); const m = t.match(/Han contestado a Chispa\s+(\d+)/i); return m ? [Number(m[1])] : [NaN]; };
  const [a0] = await mm();
  const r = await kid.request.post(BASE + '/api/mayores/edad', { data: { age: 41 } });
  check('contestar la edad funciona', r.ok());
  await kp.waitForTimeout(1000);
  const [a1] = await mm();
  check('contestar la edad suma uno a «Han contestado a Chispa»', a1 === a0 + 1, `${a0} → ${a1}`);

  // 3. Nada de esto deja cookies de seguimiento
  const names = (await kid.cookies()).map((c) => c.name).sort();
  check('solo existe la cookie de edad (sin cookies de seguimiento)', names.every((n) => n === 'lm_edad'), names.join(','));

  // 4. Sin METRICS_TOKEN el endpoint de entrada existe solo con clave; un peque no ve nada raro
  check('sin errores de JS', errs.length === 0, errs.join(' | '));
  await b.close();
  const ok = results.every(Boolean);
  console.log(ok ? '\nMÉTRICAS OK' : '\nMÉTRICAS FALLÓ');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
