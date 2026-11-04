const { OUT: S, BASE, launch, openChild } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await launch();
  const mk = () => b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const parent = await (await mk()).newPage();
  const cctx = await mk(); const child = await cctx.newPage();
  const errs = []; for (const [n, p] of [['parent', parent], ['child', child]]) p.on('pageerror', (e) => errs.push(n + ':' + e.message));
  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Lucía'); await parent.getByRole('checkbox').check();
  await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala real está lista', { timeout: 30000 });
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await parent.locator('p.font-mono').first().innerText()).trim();
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });

  // Panel: el enlace del niño puede pedir mayúsculas
  const wa = parent.getByRole('link', { name: 'Enviármelo' });
  check('por defecto, el enlace del niño no pide mayúsculas', !decodeURIComponent(await wa.getAttribute('href')).includes('letras=mayus'));
  await parent.locator('label[for=caps-link]').click();
  check('al marcar "Primeros lectores", el enlace lleva ?letras=mayus', decodeURIComponent(await wa.getAttribute('href')).includes('?letras=mayus'));
  await parent.screenshot({ path: S + '/ca1-parent.png' });

  // Niño: botón Aa y mayúsculas
  await openChild(child, childLink, {});
  await parent.getByText('Lucía ha abierto el mensaje').first().waitFor({ timeout: 10000 });
  await child.fill('#royal-draft', 'hola papá noel'); await child.keyboard.press('Enter');
  await parent.waitForSelector('text=hola papá noel');
  const tt = () => child.evaluate(() => getComputedStyle(document.querySelector('[role=log]')).textTransform);
  check('por defecto el texto va en minúsculas/normal', (await tt()) === 'none');
  const btn = child.getByRole('button', { name: 'Letras en mayúsculas' });
  check('el niño ve el botón "Aa" en la cabecera', await btn.isVisible() && (await btn.getAttribute('aria-pressed')) === 'false');
  await btn.click();
  check('al pulsarlo, todo el texto pasa a MAYÚSCULAS', (await tt()) === 'uppercase' && (await btn.getAttribute('aria-pressed')) === 'true');
  check('y también lo que escribe', (await child.evaluate(() => getComputedStyle(document.getElementById('royal-draft')).textTransform)) === 'uppercase');
  await child.screenshot({ path: S + '/ca2-child-caps.png' });
  await child.reload({ waitUntil: 'networkidle' });
  await child.getByRole('button', { name: /Abrir mensaje de/ }).click({ timeout: 3000 }).catch(() => {});
  await child.waitForSelector('#royal-draft');
  check('se recuerda en ese dispositivo al recargar', (await tt()) === 'uppercase');
  await child.getByRole('button', { name: 'Letras en mayúsculas' }).click();
  check('se puede volver a minúsculas', (await tt()) === 'none');

  // Dispositivo nuevo con el enlace de mayúsculas
  const kid2 = await (await mk()).newPage();
  await kid2.goto(childLink.replace(/^https?:\/\/[^/]+/, BASE) + '?letras=mayus', { waitUntil: 'domcontentloaded' });
  await kid2.getByRole('button', { name: /Abrir mensaje de/ }).click({ timeout: 20000 });
  await kid2.waitForSelector('#royal-draft');
  check('con ?letras=mayus, un dispositivo nuevo arranca en MAYÚSCULAS', (await kid2.evaluate(() => getComputedStyle(document.querySelector('[role=log]')).textTransform)) === 'uppercase');
  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
