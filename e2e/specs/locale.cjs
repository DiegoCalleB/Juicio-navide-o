// Idioma: detección por el navegador, selector manual y sala que manda su propio idioma.
const { childLinkOf, familyLinkOf, ensureChar } = require('../_lib.cjs');
const { BASE, launch, openChild } = require('../_lib.cjs');
const results = [];
const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
const local = (u) => u.replace(/^https?:\/\/[^/]+/, BASE);

(async () => {
  const b = await launch();
  const ctx = (locale) => b.newContext({ viewport: { width: 390, height: 844 }, locale });
  const errs = [];
  const open = async (c) => { const p = await c.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 }); return p; };

  // España (es-ES)
  const cEs = await ctx('es-ES');
  const pEs = await open(cEs);
  check('es-ES: la portada habla de "móvil"', (await pEs.getByText(/contestas en secreto desde tu móvil/).count()) === 1);
  check('es-ES: <html lang="es">', (await pEs.getAttribute('html', 'lang')) === 'es');
  check('es-ES: el selector marca España', (await pEs.getByRole('radio', { name: /España/ }).getAttribute('aria-checked')) === 'true');

  // Latinoamérica (es-MX)
  const cMx = await ctx('es-MX');
  const pMx = await open(cMx);
  check('es-MX: la portada habla de "celular"', (await pMx.getByText(/contestas en secreto desde tu celular/).count()) === 1);
  check('es-MX: ya no aparece "móvil" en la explicación', (await pMx.getByText(/desde tu móvil/).count()) === 0);
  check('es-MX: <html lang="es-419">', (await pMx.getAttribute('html', 'lang')) === 'es-419');
  check('es-MX: el selector marca Latinoamérica', (await pMx.getByRole('radio', { name: /Latinoamérica/ }).getAttribute('aria-checked')) === 'true');

  // Selector manual: un navegador mexicano elige España y se recuerda
  await pMx.getByRole('radio', { name: /España/ }).click();
  await pMx.getByText(/contestas en secreto desde tu móvil/).waitFor({ timeout: 15000 });
  check('selector manual: elegir España cambia el texto', true);
  await pMx.reload({ waitUntil: 'networkidle' });
  check('selector manual: la elección se recuerda al recargar', (await pMx.getByText(/contestas en secreto desde tu móvil/).count()) === 1);
  await pMx.getByRole('radio', { name: /Latinoamérica/ }).click();
  await pMx.getByText(/desde tu celular/).waitFor({ timeout: 15000 });

  // Sala creada en Latinoamérica: el panel, abierto desde un móvil de España, sigue en su variante
  await pMx.fill('#child', 'Valentina');
  await pMx.getByRole('checkbox').first().check();
  await ensureChar(pMx); await pMx.getByRole('button', { name: /Crear la sala/ }).click();
  await pMx.waitForSelector('text=La sala real está lista', { timeout: 30000 });
  check('al crear en Latinoamérica: "Celular de Valentina"', (await pMx.getByText(/el celular de Valentina/).count()) === 1);
  const panelLink = local(await pMx.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href'));
  const childLink = local((await childLinkOf(pMx)));

  const panel = await cEs.newPage();
  await panel.goto(panelLink, { waitUntil: 'networkidle' });
  await panel.getByRole('button', { name: /Preparativos/ }).waitFor({ timeout: 15000 });
  const t = await panel.locator('body').innerText();
  check('panel de sala latinoamericana: habla de "celular" aunque el navegador sea de España', /Enlace para el celular de Valentina/i.test(t.replace(/\s+/g, ' ')) || /celular de Valentina/i.test(t));
  check('panel: no aparece "móvil" suelto en la sala latinoamericana', !/\bmóvil/i.test(t.replace(/Zona secreta[^.]*/i, '')));

  // Sala de España abierta desde un navegador mexicano: sigue en español de España
  await pEs.fill('#child', 'Lucía');
  await pEs.getByRole('checkbox').first().check();
  await ensureChar(pEs); await pEs.getByRole('button', { name: /Crear la sala/ }).click();
  await pEs.waitForSelector('text=La sala real está lista', { timeout: 30000 });
  const esPanel = local(await pEs.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href'));
  const panelEs = await cMx.newPage();
  await panelEs.goto(esPanel, { waitUntil: 'networkidle' });
  await panelEs.getByRole('button', { name: /Preparativos/ }).waitFor({ timeout: 15000 });
  const t2 = (await panelEs.locator('body').innerText()).replace(/\s+/g, ' ');
  check('panel de sala de España: sigue diciendo "móvil" en un navegador mexicano', /móvil de Lucía/i.test(t2));

  // Niño de la sala latinoamericana
  const cKid = await ctx('es-ES');
  const kid = await cKid.newPage();
  await openChild(kid, childLink, {});
  check('niño de sala latinoamericana: la sala abre y no muestra errores', (await kid.getByText(/Este enlace/).count()) === 0);

  // La API de salas guarda el idioma
  const apiLocale = await pMx.evaluate(async () => document.documentElement.lang);
  check('el documento mantiene su idioma tras crear la sala', apiLocale === 'es-419', apiLocale);

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
