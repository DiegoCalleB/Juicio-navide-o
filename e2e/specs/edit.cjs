const { OUT: S, BASE, launch, openChild } = require('../_lib.cjs');
const { childLinkOf, familyLinkOf } = require('../_lib.cjs');
const openSetup = async (page) => { const t = page.getByRole('button', { name: /Preparativos/ }); if ((await t.getAttribute('aria-expanded')) !== 'true') await t.click(); };
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await launch();
  const mk = () => b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const parent = await (await mk()).newPage(), child = await (await mk()).newPage();
  const errs = []; for (const [n, p] of [['parent', parent], ['child', child]]) p.on('pageerror', (e) => errs.push(n + ':' + e.message));
  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Lucía'); await parent.getByRole('checkbox').check();
  await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala real está lista', { timeout: 30000 });
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await childLinkOf(parent));
  const childToken = childLink.split('/r/')[1], parentToken = pajeHref.split('/paje/')[1];
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  await openChild(child, childLink, {});
  await parent.getByText('Lucía ha abierto el mensaje').first().waitFor({ timeout: 10000 });

  // 1. Editar un mensaje del personaje
  await parent.fill('#reply', 'Te contesto con una errata: Jo jo jo');
  await parent.getByRole('button', { name: /Enviar como Papá Noel/ }).click();
  await child.waitForSelector('text=Te contesto con una errata', { timeout: 10000 });
  await parent.getByRole('button', { name: 'Corregir texto' }).last().click();
  await parent.locator('textarea[id^=edit-]').fill('Te contesto con el texto bien escrito');
  await parent.getByRole('button', { name: 'Guardar corrección' }).click();
  check('el panel muestra el texto corregido', await parent.getByText('Te contesto con el texto bien escrito').first().waitFor({ timeout: 8000 }).then(() => true, () => false));
  check('el móvil del niño recibe la corrección', await child.getByText('Te contesto con el texto bien escrito').first().waitFor({ timeout: 10000 }).then(() => true, () => false));
  check('el texto antiguo ya no aparece en el niño', (await child.getByText('errata').count()) === 0);
  const audioEdit = await fetch(`${BASE}/api/rooms/${childToken}/message/00000000-0000-4000-8000-000000000000`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'hack' }) });
  check('el niño NO puede editar mensajes (404)', audioEdit.status === 404);
  const emptyEdit = await fetch(`${BASE}/api/rooms/${parentToken}/message/no-es-uuid`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'x' }) });
  check('id no válido → 400', emptyEdit.status === 400);

  // 2. Editar la sala: nombre y personaje
  await openSetup(parent);
  await parent.getByLabel('Nombre del peque').fill('Lucía María');
  await parent.getByRole('button', { name: 'Guardar cambios' }).click();
  check('tras guardar, la cabecera muestra el nuevo nombre', await parent.getByText('Contestas como Papá Noel a Lucía María').waitFor({ timeout: 15000 }).then(() => true, () => false));
  // Tras recargar, el panel carga los mensajes y pliega los preparativos: esperamos a que se estabilice.
  await parent.getByText('Te contesto con el texto bien escrito').first().waitFor({ timeout: 10000 });
  await parent.waitForTimeout(800);
  await openSetup(parent);
  await parent.getByRole('radio', { name: 'Rey Melchor' }).click();
  await parent.getByRole('button', { name: 'Guardar cambios' }).click();
  check('tras cambiar de personaje, la cabecera lo muestra', await parent.getByText('Contestas como Rey Melchor a Lucía María').waitFor({ timeout: 15000 }).then(() => true, () => false));
  const roomPatch = await fetch(`${BASE}/api/rooms/${childToken}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childName: 'Hack' }) });
  check('el niño NO puede editar la sala (404)', roomPatch.status === 404);
  const empty = await fetch(`${BASE}/api/rooms/${parentToken}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  check('PATCH sin cambios → 400', empty.status === 400);
  await parent.screenshot({ path: S + '/ed1-panel-admin.png' });

  // 3. Borrar la sala entera
  await openSetup(parent);
  await parent.getByRole('button', { name: 'Borrar esta sala' }).click();
  await parent.getByRole('alertdialog', { name: 'Confirmar borrado de la sala' }).getByRole('button', { name: 'No' }).click();
  check('"No" no borra la sala', await parent.getByRole('button', { name: 'Borrar esta sala' }).isVisible().catch(() => false));
  await parent.getByRole('button', { name: 'Borrar esta sala' }).click();
  await parent.getByRole('button', { name: 'Sí, borrar' }).click();
  await parent.waitForURL((u) => new URL(u).pathname === '/', { timeout: 15000 }).then(() => check('tras borrar, vuelve a la portada', true)).catch(() => check('tras borrar, vuelve a la portada', false));
  const api = await fetch(`${BASE}/api/rooms/${parentToken}/messages`);
  check('la sala ya no existe en la API (404)', api.status === 404);
  const apiChild = await fetch(`${BASE}/api/rooms/${childToken}/messages`);
  check('el enlace del niño tampoco funciona (404)', apiChild.status === 404);
  check('el enlace ya no aparece en "Tus salas"', await parent.evaluate((t) => (localStorage.getItem('magic-rooms') || '').includes(t), parentToken).then((x) => !x));
  await child.waitForSelector('text=Este enlace ya no funciona', { timeout: 20000 }).then(() => check('el móvil del niño muestra "Este enlace ya no funciona"', true)).catch(() => check('el móvil del niño muestra "Este enlace ya no funciona"', false));
  await child.screenshot({ path: S + '/ed2-child-gone.png' });

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
