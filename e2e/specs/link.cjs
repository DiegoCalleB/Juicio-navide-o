const { BASE, launch, openChild, pinSetup } = require('../_lib.cjs');
const results = [];
const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await launch();
  const mk = async () => (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const parent = await mk(), child = await mk();
  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Lucía'); await parent.getByRole('checkbox').check();
  await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala real está lista');
  check('al crear hay botón "Enviármelo por correo"', (await parent.getByRole('link', { name: /Enviármelo por correo/ }).count()) > 0);
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const oldLink = (await parent.locator('p.font-mono').first().innerText()).trim();
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  await openChild(child, oldLink, {});
  check('el enlace antiguo funciona', (await child.getByText(/Este enlace (ya )?no funciona/).count()) === 0);

  await pinSetup(parent);
  check('el panel ofrece guardar el enlace por correo', await parent.getByRole('button', { name: /Enviármelo por correo/ }).isVisible());
  await parent.getByRole('button', { name: /Cambiar el enlace/ }).click();
  check('pide confirmación', await parent.getByRole('alertdialog').isVisible());
  await Promise.all([parent.waitForEvent('load'), parent.getByRole('button', { name: 'Sí, cambiar' }).click()]);
  await parent.waitForLoadState('networkidle');
  await pinSetup(parent);
  const wa = await parent.getByRole('link', { name: /Enviármelo$/ }).getAttribute('href');
  const newLink = decodeURIComponent(wa.split('text=')[1]);
  check('el panel muestra un enlace distinto', newLink && newLink.trim().split('/r/')[1] !== oldLink.split('/r/')[1], newLink.trim() + ' vs ' + oldLink);

  await child.goto(oldLink.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: 'domcontentloaded' });
  await child.getByText(/Este enlace (ya )?no funciona/).waitFor({ timeout: 15000 }).catch(() => {});
  check('el enlace antiguo ya no funciona', (await child.getByText(/Este enlace (ya )?no funciona/).count()) > 0);
  await openChild(child, newLink.trim(), {});
  await child.waitForSelector('[role=log], textarea, input', { timeout: 15000 }).catch(() => {});
  check('el enlace nuevo funciona', (await child.getByText(/ya no funciona/).count()) === 0);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})();
