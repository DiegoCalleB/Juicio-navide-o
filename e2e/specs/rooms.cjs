const { OUT: S, BASE, launch } = require('../_lib.cjs');
const results = [];
const check = (name, ok, extra = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  → ' + extra : '')); };
(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  check('portada sin salas guardadas: no aparece "Tus salas"', (await page.getByText('Tus salas en este móvil').count()) === 0);

  const create = async (name, character) => {
    await page.fill('#child', name);
    if (character) await page.getByText(character, { exact: false }).first().click();
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /Crear la sala/ }).click();
    await page.waitForSelector('text=La sala real está lista', { timeout: 30000 });
  };
  await create('Lucía');
  check('al crear: avisa de guardar el enlace', await page.getByText('Guarda el enlace del panel ahora').isVisible());
  check('los textos hablan de "panel de los padres" (no "Paje Real")', (await page.getByText('Paje Real').count()) === 0 && await page.getByRole('link', { name: /Abrir mi panel de los padres/ }).isVisible());
  await page.screenshot({ path: S + '/ro1-created.png' });
  await page.getByRole('button', { name: /Preparar otra sala/ }).click();
  check('"Preparar otra sala" vuelve al formulario vacío', (await page.inputValue('#child')) === '');
  await create('Mateo', 'Baltasar');
  await page.reload({ waitUntil: 'networkidle' });
  check('tras recargar, la portada lista las 2 salas de este móvil', await page.getByText('Tus salas en este móvil').isVisible() && (await page.getByRole('link', { name: 'Abrir panel de los padres' }).count()) === 2);
  check('cada sala muestra su niño y su personaje', await page.locator('section[aria-labelledby=my-rooms]').getByText('con Papá Noel').isVisible() && await page.locator('section[aria-labelledby=my-rooms]').getByText('con Rey Baltasar').isVisible());
  await page.screenshot({ path: S + '/ro2-myrooms.png' });
  await page.getByRole('link', { name: 'Abrir panel de los padres' }).first().click();
  check('"Abrir panel" lleva al panel correcto', await page.getByText(/Contestas como Rey Baltasar a Mateo/).waitFor({ timeout: 20000 }).then(() => true, () => false));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Quitar la sala de Mateo de la lista' }).click();
  check('"Quitar" la saca de la lista', (await page.getByRole('link', { name: 'Abrir panel de los padres' }).count()) === 1);
  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
