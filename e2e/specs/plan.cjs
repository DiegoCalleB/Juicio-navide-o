const { OUT: S, FIX, BASE, launch, openChild, ensureFixtures } = require('../_lib.cjs');
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok: !!ok, extra }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  → ' + extra : '')); };
const pad = (n) => String(n).padStart(2, '0');

(async () => {
  await ensureFixtures();
  const b = await launch();
  const mk = () => b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const parent = await (await mk()).newPage();
  const child = await (await mk()).newPage();
  const errs = [];
  for (const [n, p] of [['parent', parent], ['child', child]]) p.on('pageerror', (e) => errs.push(n + ':' + e.message));

  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Lucía');
  await parent.getByRole('checkbox').check();
  await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala real está lista', { timeout: 30000 });
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await parent.locator('p.font-mono').first().innerText()).trim();
  const parentToken = pajeHref.split('/paje/')[1];
  const childToken = childLink.split('/r/')[1];
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });

  // ── 1. Preparativos plegables
  const toggle = parent.getByRole('button', { name: /Preparativos/ });
  check('sala nueva: los preparativos están abiertos', (await toggle.getAttribute('aria-expanded')) === 'true');
  await openChild(child, childLink, {});
  await parent.getByText('Lucía ha abierto el mensaje').first().waitFor({ timeout: 10000 });
  check('al abrir el niño, los preparativos se pliegan solos', (await toggle.getAttribute('aria-expanded')) === 'false');
  check('plegados: "Empezar la sorpresa" no se ve', !(await parent.getByRole('button', { name: /Empezar la sorpresa/ }).isVisible()));
  await toggle.click();
  check('se pueden volver a abrir a mano', await parent.getByRole('button', { name: /Empezar la sorpresa/ }).isVisible());
  await toggle.click();

  // ── 3. Respuestas a fotos y dibujos
  await child.getByTestId('photo-input').setInputFiles(FIX + '/foto-nino.jpg');
  await parent.waitForSelector('img[alt="Foto"]', { timeout: 15000 });
  check('foto del niño: el panel ofrece respuestas para su dibujo', await parent.getByText('ha enviado una foto o dibujo').isVisible());
  const chip = parent.getByRole('button', { name: /Qué dibujo tan bonito/ }).first();
  await chip.click();
  check('al pulsar una sugerencia se rellena con su nombre', (await parent.inputValue('#reply')).includes('Lucía'));
  await parent.screenshot({ path: S + '/pl1-photo-replies.png' });
  await parent.getByRole('button', { name: /Enviar como Papá Noel/ }).click();
  await parent.waitForSelector('text=ya ha contestado', { timeout: 8000 });
  check('tras contestar desaparece el bloque de sugerencias', await parent.getByText('ha enviado una foto o dibujo').waitFor({ state: 'detached', timeout: 8000 }).then(() => true, () => false));

  // ── 2. Programar mensajes
  const when = new Date(Date.now() + 2 * 60_000);
  const hhmm = `${pad(when.getHours())}:${pad(when.getMinutes())}`;
  const today = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`;
  await parent.getByRole('button', { name: /Programar/ }).first().click();
  const dlg = parent.getByRole('dialog', { name: 'Programar mensajes' });
  check('se abre la hoja de programación con Nochebuena y Mañana de Navidad', await dlg.getByRole('tab', { name: 'Nochebuena' }).isVisible() && await dlg.getByRole('tab', { name: 'Mañana de Navidad' }).isVisible());
  await dlg.getByRole('tab', { name: 'Mañana de Navidad' }).click();
  check('la mañana de Navidad incluye la pantalla de sorpresa', await dlg.getByText('Pantalla de sorpresa').isVisible());
  await dlg.getByRole('tab', { name: 'Nochebuena' }).click();
  await dlg.locator('input[type=date]').fill(today);
  const times = dlg.locator('input[type=time]');
  await times.nth(0).fill(hhmm);
  await dlg.getByRole('checkbox').nth(1).uncheck();
  await dlg.getByRole('checkbox').nth(2).uncheck();
  await parent.screenshot({ path: S + '/pl2-planner.png' });
  await dlg.getByRole('button', { name: 'Programar 1 mensaje' }).click();
  await parent.waitForSelector('text=1 mensaje programado', { timeout: 8000 });
  check('se programa y el panel lo confirma', true);
  check('el panel lista el mensaje programado con su hora', await parent.getByText(`Se entregará a las ${hhmm}`).first().waitFor({ timeout: 8000 }).then(() => true, () => false));
  check('el niño NO lo ve todavía', (await child.getByText('Ya estoy cargando el trineo').count()) === 0);

  // sorpresa programada por API para la misma hora (para ver que llega con la sala abierta)
  const post = (path, body) => fetch(`${BASE}/api/rooms/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const iso = (ms) => new Date(Date.now() + ms).toISOString();
  const past = await post(`${parentToken}/reply`, { text: 'hola', delayMinutes: 0, scheduledAt: iso(-5 * 60_000) });
  check('fecha en el pasado → 400', past.status === 400);
  const far = await post(`${parentToken}/reply`, { text: 'hola', delayMinutes: 0, scheduledAt: iso(100 * 86_400_000) });
  check('más de 90 días → 400', far.status === 400);
  const asChild = await post(`${childToken}/reply`, { text: 'hola', delayMinutes: 0, scheduledAt: iso(120_000) });
  check('el niño no puede programar (404)', asChild.status === 404);

  // cancelar
  const toCancel = await post(`${parentToken}/reply`, { text: 'Este se cancela antes de llegar', delayMinutes: 0, scheduledAt: iso(150_000) });
  check('programar por API → 201', toCancel.status === 201);
  await parent.waitForSelector('text=Este se cancela antes de llegar', { timeout: 8000 });
  const cancelBtn = parent.locator('div', { hasText: 'Este se cancela antes de llegar' }).getByRole('button', { name: 'Cancelar este mensaje' }).last();
  await cancelBtn.click();
  await parent.waitForSelector('text=Mensaje programado cancelado', { timeout: 8000 });
  check('cancelar quita el mensaje del panel', await parent.getByText('Este se cancela antes de llegar').first().waitFor({ state: 'detached', timeout: 8000 }).then(() => true, () => false));
  const list = await (await fetch(`${BASE}/api/rooms/${parentToken}/messages`)).text();
  check('y desaparece también de la API', !list.includes('Este se cancela antes de llegar'));
  const delChild = await fetch(`${BASE}/api/rooms/${childToken}/pending/00000000-0000-4000-8000-000000000000`, { method: 'DELETE' });
  check('el niño no puede cancelar (404)', delChild.status === 404);
  const delBad = await fetch(`${BASE}/api/rooms/${parentToken}/pending/no-es-un-uuid`, { method: 'DELETE' });
  check('id no válido → 400', delBad.status === 400);

  // sorpresa programada: llega mientras el niño NO tiene la sala abierta
  const sur = await post(`${parentToken}/reply`, { text: 'Feliz Navidad, sorpresa programada', delayMinutes: 0, surprise: true, scheduledAt: iso(100_000) });
  check('sorpresa programada → 201', sur.status === 201);

  // ── 4. Entrega en directo
  console.log('… esperando la entrega programada (≈2 min)');
  const t0 = Date.now();
  await child.waitForSelector('text=Ya estoy cargando el trineo', { timeout: 170000 })
    .then(() => check('el mensaje programado llega al niño a su hora, sin recargar', true, Math.round((Date.now() - t0) / 1000) + ' s'))
    .catch(() => check('el mensaje programado llega al niño a su hora, sin recargar', false));
  check('en directo, la sorpresa programada sale a pantalla completa', await child.getByRole('dialog', { name: /Mensaje de Papá Noel/ }).getByText('sorpresa programada').isVisible().catch(() => false));
  await child.screenshot({ path: S + '/pl3-child-delivered.png' });

  // Un dispositivo nuevo (sala cerrada cuando llegó) ve la sorpresa a pantalla completa la primera vez
  const late = await (await mk()).newPage();
  await late.goto(childLink.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: 'domcontentloaded' });
  await late.getByRole('button', { name: /Abrir mensaje de/ }).click({ timeout: 20000 });
  check('sorpresa que llegó con la sala cerrada: se enseña al abrir', await late.getByRole('dialog', { name: /Mensaje de Papá Noel/ }).getByText('sorpresa programada').waitFor({ timeout: 10000 }).then(() => true, () => false));
  await late.reload({ waitUntil: 'domcontentloaded' });
  await late.getByRole('button', { name: /Abrir mensaje de/ }).click({ timeout: 3000 }).catch(() => {});
  await late.waitForTimeout(1500);
  check('y no se repite al volver a entrar', (await late.getByRole('dialog', { name: /Mensaje de Papá Noel/ }).count()) === 0);

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  const failed = results.filter((r) => !r.ok);
  console.log(`\nRESUMEN: ${results.length - failed.length}/${results.length} pruebas OK`);
  if (failed.length) console.log('FALLOS:', failed.map((f) => f.name).join(' ; '));
  await b.close();
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
