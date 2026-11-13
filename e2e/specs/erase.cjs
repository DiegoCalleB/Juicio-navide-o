const { OUT: S, BASE, launch, openChild, ensureChar } = require('../_lib.cjs');
const { childLinkOf, familyLinkOf } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await launch();
  const mk = () => b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const parent = await (await mk()).newPage(), child = await (await mk()).newPage();
  const errs = []; for (const [n, p] of [['parent', parent], ['child', child]]) p.on('pageerror', (e) => errs.push(n + ':' + e.message));
  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Lucía'); await parent.getByRole('checkbox').check();
  await ensureChar(parent); await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala real está lista', { timeout: 30000 });
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await childLinkOf(parent));
  const childToken = childLink.split('/r/')[1], parentToken = pajeHref.split('/paje/')[1];
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  await openChild(child, childLink, {});
  await parent.getByText('Lucía ha abierto el mensaje').first().waitFor({ timeout: 10000 });

  await child.fill('#royal-draft', 'Quiero un tren, sin querer escribí mal'); await child.keyboard.press('Enter');
  await parent.waitForSelector('text=Quiero un tren, sin querer');
  await parent.getByText('Quiero un tren, sin querer').first().scrollIntoViewIfNeeded();
  const msgCard = parent.locator('div', { hasText: 'Quiero un tren, sin querer' }).filter({ has: parent.getByRole('button', { name: 'Borrar mensaje' }) }).last();
  await msgCard.getByRole('button', { name: 'Borrar mensaje' }).click();
  check('el panel pide confirmación antes de borrar', await parent.getByRole('alertdialog', { name: 'Confirmar borrado' }).isVisible());
  await parent.getByRole('alertdialog', { name: 'Confirmar borrado' }).getByRole('button', { name: 'No' }).click();
  check('"No" conserva el mensaje', (await parent.getByText('Quiero un tren, sin querer').count()) > 0);
  await msgCard.getByRole('button', { name: 'Borrar mensaje' }).click();
  await parent.getByRole('button', { name: 'Sí, borrar' }).click();
  check('tras confirmar, desaparece del panel', await parent.getByText('Quiero un tren, sin querer').first().waitFor({ state: 'detached', timeout: 8000 }).then(() => true, () => false));
  check('y desaparece del móvil del niño', await child.getByText('Quiero un tren, sin querer').first().waitFor({ state: 'detached', timeout: 8000 }).then(() => true, () => false));
  await child.screenshot({ path: S + '/er1-child-after-erase.png' });

  const r1 = await fetch(`${BASE}/api/rooms/${childToken}/erase/00000000-0000-4000-8000-000000000000`, { method: 'DELETE' });
  check('el niño NO puede borrar (404)', r1.status === 404);
  const r2 = await fetch(`${BASE}/api/rooms/${parentToken}/erase/no-es-uuid`, { method: 'DELETE' });
  check('id no válido → 400', r2.status === 400);
  const r3 = await fetch(`${BASE}/api/rooms/${parentToken}/erase/00000000-0000-4000-8000-000000000000`, { method: 'DELETE' });
  check('mensaje inexistente → 404', r3.status === 404);

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
