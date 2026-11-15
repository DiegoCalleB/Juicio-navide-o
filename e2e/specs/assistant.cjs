// Ayudante «✨ Ayúdame a escribirlo» (Gemini simulado con GEMINI_FAKE=1)
const { OUT: S, BASE, launch, pinSetup, ensureChar } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await launch(['--no-sandbox']);
  const parent = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; parent.on('pageerror', (e) => errs.push(e.message));
  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Lucía'); await parent.getByRole('checkbox', { name: /Soy su madre/ }).check();
  await ensureChar(parent); await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala está lista');
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  await pinSetup(parent);

  const open = parent.getByRole('button', { name: /Ayúdame a escribirlo/ });
  check('el panel ofrece «✨ Ayúdame a escribirlo»', await open.isVisible());
  await open.click();
  await parent.fill('#assistant-idea', 'ha recogido sus juguetes');
  const [req] = await Promise.all([parent.waitForRequest((r) => r.url().includes('/suggest')), parent.getByRole('button', { name: 'Proponer' }).click()]);
  check('a la IA no se le envía el nombre del niño', !/Lucía/.test(req.postData() || ''), req.postData());
  const list = parent.getByRole('list', { name: 'Propuestas' }).getByRole('button');
  await list.first().waitFor({ timeout: 10000 });
  const texts = await list.allInnerTexts();
  check('propone 3 mensajes', texts.length === 3, String(texts.length));
  check('el nombre del niño aparece en las propuestas (sustituido en el navegador)', texts.every((t) => /Lucía/.test(t) && !/\[nombre\]/.test(t)), texts[0]);
  await parent.screenshot({ path: S + '/as1-propuestas.png' });
  await list.nth(1).click();
  const val = await parent.inputValue('#reply');
  check('al tocar una, pasa al cuadro del mensaje para revisarla', val === texts[1], val);
  check('el ayudante se cierra tras elegir', (await parent.getByRole('list', { name: 'Propuestas' }).count()) === 0);

  // Validación: idea demasiado corta
  const short = await parent.evaluate(async () => { const t = location.pathname.split('/paje/')[1]; const r = await fetch('/api/rooms/' + t + '/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idea: 'a' }) }); return r.status; });
  check('una idea vacía o muy corta se rechaza', short === 400, String(short));
  // Solo padres
  const childTry = await parent.evaluate(async () => { const r = await fetch('/api/rooms/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP1/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idea: 'hola hola' }) }); return r.status; });
  check('sin enlace de padres válido no responde', childTry === 404, String(childTry));
  check('sin errores de página', errs.length === 0, errs.join(' | '));
  console.log(`RESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
