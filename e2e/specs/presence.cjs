const { OUT: S, BASE, launch, ensureChar } = require('../_lib.cjs');
const { childLinkOf, familyLinkOf } = require('../_lib.cjs');
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok: !!ok, extra }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  → ' + extra : '')); };

(async () => {
  const b = await launch();
  const mk = () => b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const parent = await (await mk()).newPage();
  const child = await (await mk()).newPage();
  const errs = [];
  for (const [n, p] of [['parent', parent], ['child', child]]) p.on('pageerror', (e) => errs.push(n + ':' + e.message));

  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Lucía');
  await parent.getByRole('checkbox').check();
  await ensureChar(parent); await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala está lista', { timeout: 30000 });
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await childLinkOf(parent));
  const childToken = childLink.split('/r/')[1];
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });

  check('padres: "Lucía aún no ha abierto el enlace"', await parent.getByText('Lucía aún no ha abierto el enlace').waitFor({ timeout: 10000 }).then(() => true, () => false));

  await child.goto(childLink.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: 'domcontentloaded' });
  check('padres: ven que Lucía está en la sala', await parent.getByText('Lucía está en la sala').waitFor({ timeout: 15000 }).then(() => true, () => false));
  check('el aviso de apertura aún no aparece', (await parent.getByText('ha abierto el mensaje').count()) === 0);

  await child.getByRole('button', { name: /Abrir mensaje de/ }).click({ timeout: 20000 });
  check('padres: "Lucía ha abierto el mensaje" al tocar el sello', await parent.getByText('Lucía ha abierto el mensaje').first().waitFor({ timeout: 10000 }).then(() => true, () => false));
  check('padres: el título avisa con 🎁', (await parent.title()).includes('🎁'));
  await parent.screenshot({ path: S + '/pr1-opened.png' });
  await parent.getByRole('button', { name: 'Primer saludo' }).first().click();
  check('el atajo "Primer saludo" selecciona esa plantilla', await parent.getByRole('tab', { name: 'Primer saludo', selected: true }).isVisible().catch(() => false));

  const post = async (path) => (await fetch(`${BASE}/api/rooms/${path}`, { method: 'POST' })).status;
  check('los padres NO pueden usar /opened (404)', (await post(`${pajeHref.split('/paje/')[1]}/opened`)) === 404);
  check('token inválido en /opened → 404', (await post('token-invalido/opened')) === 404);
  check('el niño sí puede (200)', (await post(`${childToken}/opened`)) === 200);

  await child.close();
  check('padres: al salir el niño, "ahora no está en la sala"', await parent.getByText('ahora no está en la sala').waitFor({ timeout: 15000 }).then(() => true, () => false));

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  const failed = results.filter((r) => !r.ok);
  console.log(`\nRESUMEN: ${results.length - failed.length}/${results.length} pruebas OK`);
  await b.close();
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
