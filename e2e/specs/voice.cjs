const { OUT: S, FIX, BASE, launch, openChild, pinSetup, ensureChar } = require('../_lib.cjs');
const { childLinkOf, familyLinkOf } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await launch(['--no-sandbox', '--autoplay-policy=no-user-gesture-required']);
  const mk = async () => (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const parent = await mk(), child = await mk();
  const errs = []; for (const [n, p] of [['parent', parent], ['child', child]]) { p.on('pageerror', e => errs.push(n + ':' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(n + ':' + m.text().slice(0, 140)); }); }
  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Lucía'); await parent.getByRole('checkbox').check();
  await ensureChar(parent); await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala real está lista');
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await childLinkOf(parent));
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  await pinSetup(parent);
  await openChild(child, childLink, {});
  await parent.waitForSelector('[aria-label="Conectado en tiempo real"]');

  check('padres: "Nota de voz" seleccionada por defecto', await parent.getByRole('radio', { name: 'Nota de voz' }).getAttribute('aria-checked') === 'true');
  await parent.screenshot({ path: S + '/v1-parent-voice.png' });
  check('padres: el botón dice "Enviar con la voz de Papá Noel"', await parent.getByRole('button', { name: /Enviar con la voz de Papá Noel/ }).isVisible());

  // 1) Respuesta con voz real (texto muy corto = poco gasto)
  await parent.fill('#reply', '¡Jo, jo, jo! Hola, Lucía 🎅');
  const t0 = Date.now();
  await parent.getByRole('button', { name: /Enviar con la voz de Papá Noel/ }).click();
  await parent.waitForSelector('text=ya ha contestado', { timeout: 40000 });
  const genMs = Date.now() - t0;
  await child.waitForSelector('button[aria-label="Reproducir nota de voz"]', { timeout: 15000 });
  check('el niño recibe una nota de voz del personaje', true, 'generada y entregada en ' + genMs + ' ms');
  const info = await child.evaluate(async () => {
    const j = await (await fetch('/api/rooms/' + location.pathname.split('/r/')[1] + '/messages')).json();
    const m = j.data.messages.find(x => x.from === 'king' && x.kind === 'voice');
    const r = await fetch(m.audioUrl); const buf = new Uint8Array(await r.arrayBuffer());
    return { hasText: !!m.text, type: r.headers.get('content-type'), bytes: buf.length, id3: String.fromCharCode(buf[0], buf[1], buf[2]), dur: m.duration };
  });
  check('el audio es un MP3 real y el niño NO recibe el texto', info.type === 'audio/mpeg' && (info.id3 === 'ID3' || info.bytes > 3000) && info.hasText === false, JSON.stringify(info));
  const mp3ok = await child.evaluate(async () => { const j = await (await fetch('/api/rooms/' + location.pathname.split('/r/')[1] + '/messages')).json(); const m = j.data.messages.find(x => x.kind === 'voice' && x.from === 'king'); const a = new Audio(m.audioUrl); await new Promise((res, rej) => { a.onloadedmetadata = res; a.onerror = () => rej(new Error('audio error')); }); return a.duration; }).catch(e => -1);
  check('el navegador decodifica el audio (tiene duración)', mp3ok > 0.5, mp3ok + ' s');
  await child.getByRole('button', { name: 'Reproducir nota de voz' }).last().click();
  await child.waitForTimeout(700);
  check('el niño puede reproducirla', (await child.getByRole('button', { name: 'Pausar nota de voz' }).count()) > 0);
  await child.screenshot({ path: S + '/v2-child-voice.png' });
  check('el panel muestra el texto bajo la nota (los padres sí lo ven)', await parent.getByText(/Hola, Lucía/).first().isVisible());

  // 2) El emoji no se lee y la sorpresa va por texto aunque esté en modo voz
  await parent.fill('#reply', 'Sorpresa por escrito aunque esté la voz activa');
  await parent.getByRole('button', { name: /Empezar la sorpresa/ }).click();
  await child.waitForSelector('[role=dialog][aria-label="Mensaje de Papá Noel"]', { timeout: 15000 });
  check('la sorpresa se entrega como texto con su pantalla especial', await child.getByText('Sorpresa por escrito').first().isVisible());
  await child.locator('[role=dialog]').click();

  // 3) Tope por sala (límite=2): la 2ª voz pasa; la 3ª degrada a texto y avisa
  await parent.waitForTimeout(500);
  await parent.fill('#reply', 'Segunda voz'); await parent.getByRole('button', { name: /Enviar con la voz/ }).click();
  await parent.waitForSelector('text=ya ha contestado', { timeout: 40000 });
  await parent.fill('#reply', 'Tercera, ya sin voz'); await parent.getByRole('button', { name: /Enviar con la voz/ }).click();
  await parent.waitForSelector('text=límite diario de voz', { timeout: 20000 }).then(() => check('al superar el tope, avisa y entrega por escrito', true)).catch(() => check('al superar el tope, avisa y entrega por escrito', false));
  await parent.screenshot({ path: S + '/v3-parent-limit.png' });
  await child.waitForSelector('text=Tercera, ya sin voz', { timeout: 10000 }).then(() => check('el niño recibe ese mensaje como texto (nada se pierde)', true)).catch(() => check('el niño recibe ese mensaje como texto', false));

  // 4) Solo emojis → texto (no hay nada que hablar)
  const emojiOnly = await parent.evaluate(async () => { const t = location.pathname.split('/paje/')[1]; const r = await fetch('/api/rooms/' + t + '/reply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: '🎅🎄', delayMinutes: 0, mode: 'voice' }) }); return r.json(); });
  check('texto solo de emojis → se entrega por escrito sin gastar voz', emojiOnly.ok && emojiOnly.data.delivered === 'text');
  check('sin errores de página ni consola', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`RESUMEN: ${results.filter(Boolean).length}/${results.length} OK`);
  await b.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch(e => { console.error('CRASH', e.message); process.exit(2); });
