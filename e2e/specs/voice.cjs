// Voz real con ElevenLabs (gasta pocos créditos): npm run test:e2e -- --voice
const { OUT: S, BASE, launch, openChild, pinSetup, ensureChar } = require('../_lib.cjs');
const { childLinkOf } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await launch(['--no-sandbox', '--autoplay-policy=no-user-gesture-required']);
  const mk = async () => (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const parent = await mk(), child = await mk();
  const errs = []; for (const [n, p] of [['parent', parent], ['child', child]]) { p.on('pageerror', e => errs.push(n + ':' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|409/.test(m.text())) errs.push(n + ':' + m.text().slice(0, 140)); }); }
  await parent.goto(BASE + '/crear', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Lucía'); await parent.getByRole('checkbox', { name: /Soy su madre/ }).check();
  await ensureChar(parent); await parent.getByRole('button', { name: /Abrir el portal/ }).click();
  await parent.waitForSelector('text=El portal está abierto');
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await childLinkOf(parent));
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  await pinSetup(parent);

  // 1) Saludo con el nombre al abrir el sello
  const greetResp = child.waitForResponse((r) => r.url().includes('/greeting'), { timeout: 60000 });
  await child.goto(childLink.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: 'domcontentloaded' });
  const g = await (await greetResp).json();
  check('saludo: el servidor genera "¡Hola, Lucía!" con la voz del personaje', g.ok && g.data.speak && !!g.data.url, JSON.stringify(g.data).slice(0, 120));
  const clips = await child.evaluate(async (u) => {
    const out = [];
    for (const x of [u, '/voces/saludo/papa_noel.mp3']) { const r = await fetch(x); const a = new Audio(URL.createObjectURL(await r.blob())); await new Promise((res, rej) => { a.onloadedmetadata = res; a.onerror = () => rej(new Error('audio')); }); out.push(Math.round(a.duration * 10) / 10); }
    return out;
  }, g.data.url).catch((e) => [String(e)]);
  check('saludo: el nombre y el resto del saludo son audios válidos', clips.length === 2 && clips[0] > 0.5 && clips[1] > 4, JSON.stringify(clips));
  const again = await child.evaluate(async () => (await (await fetch('/api/rooms/' + location.pathname.split('/r/')[1] + '/greeting')).json()).data.url);
  check('saludo: la segunda vez se reutiliza (no se vuelve a generar)', !!again && again.split('?')[0] === g.data.url.split('?')[0]);
  await openChild(child, childLink, {});
  await parent.waitForSelector('[aria-label="Conectado en tiempo real"]');

  // 2) Panel: voz por defecto + contador de la prueba
  check('padres: "Con voz" seleccionada por defecto', await parent.getByRole('radio', { name: /Con voz/ }).getAttribute('aria-checked') === 'true');
  check('padres: la prueba muestra los 3 mensajes con voz', await parent.getByText(/te quedan 3 mensajes con la voz/).isVisible());
  check('padres: el botón dice "Enviar con la voz de Papá Noel"', await parent.getByRole('button', { name: /Enviar con la voz de Papá Noel/ }).isVisible());

  // 3) Escuchar antes de enviar, y al enviar se reutiliza ese mismo audio
  await parent.fill('#reply', '¡Jo, jo, jo! Hola, Lucía 🎅');
  const [prev] = await Promise.all([parent.waitForResponse((r) => r.url().includes('/voice-preview'), { timeout: 60000 }), parent.getByRole('button', { name: /Escuchar/ }).click()]);
  // Misma petición desde la página: sale de la caché de la escucha previa (no gasta) y da su tamaño.
  const prevBytes = await parent.evaluate(async () => { const t = location.pathname.split('/paje/')[1]; const r = await fetch('/api/rooms/' + t + '/voice-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: document.querySelector('#reply').value.trim() }) }); return (await r.arrayBuffer()).byteLength; });
  check('escuchar antes: devuelve el audio con la voz', prev.status() === 200 && prev.headers()['content-type'] === 'audio/mpeg' && prevBytes > 3000, prev.status() + ' · ' + prevBytes + ' bytes');
  await parent.screenshot({ path: S + '/v1-parent-voice.png' });
  const t0 = Date.now();
  await parent.getByRole('button', { name: /Enviar con la voz de Papá Noel/ }).click();
  await parent.waitForSelector('text=ya ha contestado', { timeout: 40000 });
  const sendMs = Date.now() - t0;
  check('al enviar lo escuchado, no se vuelve a generar (rápido)', sendMs < 2500, sendMs + ' ms');
  await child.waitForSelector('button[aria-label="Reproducir nota de voz"]', { timeout: 15000 });
  const info = await child.evaluate(async () => {
    const j = await (await fetch('/api/rooms/' + location.pathname.split('/r/')[1] + '/messages')).json();
    const m = j.data.messages.find(x => x.from === 'king' && x.kind === 'voice');
    const r = await fetch(m.audioUrl); const buf = new Uint8Array(await r.arrayBuffer());
    return { type: r.headers.get('content-type'), bytes: buf.length };
  });
  check('el niño recibe la nota de voz (MP3 real, el mismo audio escuchado)', info.type === 'audio/mpeg' && info.bytes === prevBytes, JSON.stringify(info) + ' vs ' + prevBytes);
  await child.getByRole('button', { name: 'Reproducir nota de voz' }).last().click();
  await child.waitForTimeout(700);
  check('el niño puede reproducirla', (await child.getByRole('button', { name: 'Pausar nota de voz' }).count()) > 0);
  await child.screenshot({ path: S + '/v2-child-voice.png' });
  check('padres: ahora quedan 2', await parent.getByText(/te quedan 2 mensajes/).isVisible());

  // 4) La sorpresa va por texto y no gasta voz
  await parent.fill('#reply', 'Sorpresa por escrito aunque esté la voz activa');
  await parent.getByRole('button', { name: /Empezar la sorpresa/ }).click();
  await child.waitForSelector('[role=dialog][aria-label="Mensaje de Papá Noel"]', { timeout: 15000 });
  check('la sorpresa se entrega como texto con su pantalla especial', await child.getByText('Sorpresa por escrito').first().isVisible());
  await child.locator('[role=dialog]').click();

  // 5) Dos voces más → se agotan las de la prueba
  for (const t of ['Segunda con voz', 'Tercera con voz']) {
    await parent.waitForTimeout(400);
    await parent.fill('#reply', t); await parent.getByRole('button', { name: /Enviar con la voz/ }).click();
    await parent.waitForSelector('text=ya ha contestado', { timeout: 40000 });
  }
  await parent.waitForSelector('text=/Ya has usado los 3 mensajes con voz/', { timeout: 10000 }).then(() => check('al agotarlas, el panel lo dice y ofrece el Pase', true), () => check('al agotarlas, el panel lo dice', false));
  check('ya no se ofrece "Con voz" (va por escrito)', (await parent.getByRole('radio', { name: /Con voz/ }).count()) === 0 && await parent.getByRole('button', { name: /^Enviar como Papá Noel/ }).isVisible());
  await parent.screenshot({ path: S + '/v3-parent-trial-used.png' });
  const forced = await parent.evaluate(async () => { const t = location.pathname.split('/paje/')[1]; const r = await fetch('/api/rooms/' + t + '/reply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'Cuarta, aunque pida voz', delayMinutes: 0, mode: 'voice' }) }); return r.json(); });
  check('el servidor también lo impide: entrega por escrito (prueba agotada)', forced.ok && forced.data.delivered === 'text' && forced.data.fallback === 'trial', JSON.stringify(forced.data));
  await child.waitForSelector('text=Cuarta, aunque pida voz', { timeout: 10000 }).then(() => check('el niño recibe ese mensaje como texto (nada se pierde)', true), () => check('el niño recibe ese mensaje como texto', false));

  check('sin errores de página ni consola', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`RESUMEN: ${results.filter(Boolean).length}/${results.length} OK`);
  await b.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch(e => { console.error('CRASH', e.message); process.exit(2); });
