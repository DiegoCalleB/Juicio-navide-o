// Familias: varios peques de golpe, enlace de familia que reconstruye los paneles, apodo y desplegable de peques.
const { BASE, launch, openChild } = require('../_lib.cjs');
const results = [];
const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
const local = (u) => u.replace(/^https?:\/\/[^/]+/, BASE);

(async () => {
  const b = await launch();
  const mk = async () => (await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'] })).newPage();
  const errs = [];
  const page = await mk();
  page.on('pageerror', (e) => errs.push(e.message));

  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  check('portada: sin peques guardados no hay desplegable "Tus peques"', (await page.locator('#kid-pick').count()) === 0);
  check('portada: ofrece apodo de la familia', await page.locator('#family-nick').isVisible());

  // Dos peques de golpe
  await page.fill('#child', 'Lucía');
  await page.fill('#family-nick', 'Los Estrella');
  await page.getByRole('button', { name: /¿Tienes más peques/ }).click();
  await page.fill('#extra-name-0', 'Mateo');
  await page.locator('fieldset', { hasText: 'Otro peque (2)' }).locator('select').first().selectOption('raton_perez');
  await page.getByRole('checkbox').first().check();
  check('el botón anuncia las dos salas', await page.getByRole('button', { name: 'Crear las 2 salas reales' }).isVisible());
  await page.getByRole('button', { name: 'Crear las 2 salas reales' }).click();
  await page.waitForSelector('text=¡Las salas reales están listas!', { timeout: 30000 });
  check('aviso claro: guarda el enlace de la familia', await page.getByText('Guarda el enlace de tu familia ahora').isVisible());
  const familyLink = (await page.locator('p.break-all').first().innerText()).trim();
  check('el enlace de familia tiene el formato /familia/<43 caracteres>', /\/familia\/[A-Za-z0-9_-]{43}$/.test(familyLink), familyLink.slice(-12));
  check('el enlace de familia no lleva el apodo en la dirección', !/estrella/i.test(familyLink));
  const mono = (await page.locator('p.font-mono').allInnerTexts()).map((t) => t.trim());
  check('salen cuatro enlaces (móvil y panel de cada peque)', mono.length === 4, String(mono.length));
  const [child1, panel1, child2, panel2] = mono;
  check('un botón de panel por peque', (await page.getByRole('link', { name: 'Abrir el panel de Lucía' }).count()) === 1 && (await page.getByRole('link', { name: 'Abrir el panel de Mateo' }).count()) === 1);

  // Cabeceras: el enlace de familia no se filtra por Referer ni se cachea
  const hdr = await fetch(local(familyLink)).then((r) => ({ ref: r.headers.get('referrer-policy'), cache: r.headers.get('cache-control') }));
  check('el enlace de familia va sin Referer ni caché', hdr.ref === 'no-referrer' && /no-store/.test(hdr.cache ?? ''), JSON.stringify(hdr));

  // Un móvil nuevo, sin nada guardado, abre el enlace de familia
  const fresh = await mk();
  fresh.on('pageerror', (e) => errs.push(e.message));
  await fresh.goto(local(familyLink), { waitUntil: 'networkidle' });
  check('familia: título con el apodo', await fresh.getByRole('heading', { name: 'Los Estrella' }).isVisible());
  check('familia: aparecen las dos salas', await fresh.getByRole('link', { name: 'Abrir panel de Lucía' }).isVisible() && await fresh.getByRole('link', { name: 'Abrir panel de Mateo' }).isVisible());
  check('familia: cada sala dice su personaje', await fresh.getByText('con Papá Noel').isVisible() && await fresh.getByText(/con (el )?Ratoncito Pérez/).isVisible());

  // Los paneles reconstruidos son los mismos que se crearon
  const href1 = await fresh.getByRole('link', { name: 'Abrir panel de Lucía' }).getAttribute('href');
  const href2 = await fresh.getByRole('link', { name: 'Abrir panel de Mateo' }).getAttribute('href');
  check('el panel de Lucía reconstruido coincide con el creado', local(panel1).endsWith(href1), href1.slice(-8));
  check('el panel de Mateo reconstruido coincide con el creado', local(panel2).endsWith(href2), href2.slice(-8));
  await fresh.getByRole('button', { name: 'Enlace del móvil del peque' }).first().click();
  const copiedChild = await fresh.evaluate(() => navigator.clipboard.readText());
  check('el enlace del niño reconstruido coincide con el creado', local(child1) === local(copiedChild), copiedChild.slice(-8));

  // Abrir el panel reconstruido y el enlace del niño de la sala 2
  const panel = await mk();
  panel.on('pageerror', (e) => errs.push(e.message));
  await panel.goto(BASE + href2, { waitUntil: 'networkidle' });
  check('el panel de Mateo abre y se puede contestar', await panel.locator('#reply').isVisible());
  const kid = await mk();
  await openChild(kid, child2, {});
  check('el enlace del niño de Mateo abre sin error', (await kid.getByText(/Este enlace/).count()) === 0);

  // El móvil nuevo recupera "Tus salas" y la familia
  await fresh.goto(BASE + '/', { waitUntil: 'networkidle' });
  check('móvil nuevo: "Tus salas" recupera las dos', await fresh.getByText(/Ya tengo salas en este móvil \(2\)/).isVisible());
  check('móvil nuevo: ya no pide apodo (la familia está guardada)', (await fresh.locator('#family-nick').count()) === 0);
  check('móvil nuevo: aparece el desplegable con los dos peques', (await fresh.locator('#kid-pick option').allInnerTexts()).join('|').includes('Lucía') && (await fresh.locator('#kid-pick option').allInnerTexts()).join('|').includes('Mateo'));
  await fresh.locator('#kid-pick').selectOption('Mateo');
  check('elegir en el desplegable rellena el nombre', (await fresh.inputValue('#child')) === 'Mateo');

  // Una sala nueva desde ese móvil entra en la misma familia
  await fresh.fill('#child', 'Pablo');
  await fresh.getByRole('checkbox').first().check();
  await fresh.getByRole('button', { name: /Crear la sala/ }).click();
  await fresh.waitForSelector('text=La sala real está lista', { timeout: 30000 });
  const sameFamily = (await fresh.locator('p.break-all').first().innerText()).trim();
  check('la sala nueva entra en la misma familia', sameFamily === familyLink);
  await fresh.getByRole('link', { name: 'Ver todas las salas de la familia' }).click();
  await fresh.getByRole('link', { name: 'Abrir panel de Pablo' }).waitFor({ timeout: 15000 });
  check('la familia ya tiene tres salas', (await fresh.getByRole('listitem').filter({ hasText: 'con ' }).count()) === 3);

  // Cambiar el apodo
  await fresh.fill('#family-name', 'Casa de los Duendes');
  await fresh.getByRole('button', { name: 'Guardar' }).click();
  await fresh.getByText('Guardado.').waitFor({ timeout: 10000 });
  await fresh.reload({ waitUntil: 'networkidle' });
  check('el apodo cambiado se mantiene', await fresh.getByRole('heading', { name: 'Casa de los Duendes' }).isVisible());

  // Un enlace de familia inventado no existe
  const bad = await mk();
  await bad.goto(BASE + '/familia/' + 'A'.repeat(43), { waitUntil: 'networkidle' });
  check('un enlace de familia inventado muestra "no existe"', await bad.getByText('Este enlace no existe').isVisible());
  const api = await fetch(BASE + '/api/family/' + 'B'.repeat(43));
  check('la API de familia no confirma enlaces inventados', api.status === 404);

  // El servidor no deja elegir un enlace de familia a medida
  const sneaky = await mk();
  await sneaky.goto(BASE + '/', { waitUntil: 'networkidle' });
  await sneaky.evaluate((t) => localStorage.setItem('magic-family', t), 'C'.repeat(43));
  await sneaky.reload({ waitUntil: 'networkidle' });
  await sneaky.fill('#child', 'Intruso');
  await sneaky.getByRole('checkbox').first().check();
  await sneaky.getByRole('button', { name: /Crear la sala/ }).click();
  await sneaky.waitForSelector('text=La sala real está lista', { timeout: 30000 });
  const sneakyLink = (await sneaky.locator('p.break-all').first().innerText()).trim();
  check('un enlace de familia inexistente no se adopta: se crea una familia nueva', !sneakyLink.endsWith('C'.repeat(43)));

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
