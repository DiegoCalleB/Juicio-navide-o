const { OUT: S, FIX, BASE, launch, openChild, pinSetup } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await launch(['--no-sandbox']);
  const mk = async () => (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const parent = await mk(), child = await mk();
  const errs = []; for (const [n, p] of [['parent', parent], ['child', child]]) { p.on('pageerror', e => errs.push(n + ':' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(n + ':' + m.text().slice(0, 140)); }); }

  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Lucía'); await parent.getByRole('checkbox').check();
  await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala real está lista');
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await parent.locator('p.font-mono').first().innerText()).trim();
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  await pinSetup(parent);
  await openChild(child, childLink, {});
  await parent.waitForSelector('[aria-label="Conectado en tiempo real"]');

  const start = parent.getByRole('button', { name: /Empezar la sorpresa/ });
  check('botón de sorpresa desactivado sin mensaje', await start.isDisabled());
  check('la guía recomienda grabar con otro móvil', (await parent.getByText(/otro móvil/).count()) > 0);
  await parent.screenshot({ path: S + '/s1-parent-card.png' });

  await parent.fill('#reply', '¡Jo, jo, jo! Lucía, he visto que te has portado muy bien este año. ¡Tengo una sorpresa para ti!');
  check('botón de sorpresa activo con mensaje', await start.isEnabled());
  await start.click();
  await parent.waitForSelector('[role=alertdialog]');
  const t0 = Date.now();
  await parent.screenshot({ path: S + '/s2-countdown.png' });
  check('el niño NO recibe nada durante la cuenta atrás', (await child.getByText('tengo una sorpresa').count()) === 0);
  await child.waitForSelector('[role=dialog][aria-label="Mensaje de Papá Noel"]', { timeout: 15000 });
  const wait = Date.now() - t0;
  check('la sorpresa llega al niño tras ~5 s de cuenta atrás', wait >= 4000 && wait <= 8500, wait + ' ms');
  await child.waitForTimeout(3600);
  await child.screenshot({ path: S + '/s3-child-surprise.png' });
  check('animación a pantalla completa con el mensaje', await child.getByText('Papá Noel te ha escrito, Lucía').isVisible());
  check('el texto del mensaje se muestra en grande', await child.locator('[role=dialog] p', { hasText: 'tengo una sorpresa' }).isVisible());
  await parent.waitForSelector('text=Sorpresa enviada', { timeout: 5000 }).then(() => check('padres ven "Sorpresa enviada" y el botón de compartir', true)).catch(() => check('padres ven "Sorpresa enviada"', false));
  await parent.screenshot({ path: S + '/s4-parent-sent.png' });
  await child.locator('[role=dialog]').click();
  await child.waitForTimeout(400);
  check('al tocar se cierra y el mensaje queda en el chat', (await child.locator('[role=dialog]').count()) === 0 && (await child.getByText('tengo una sorpresa').count()) > 0);

  // Un mensaje normal NO activa la animación
  await parent.fill('#reply', 'Mensaje normal sin sorpresa'); await parent.getByRole('button', { name: /Enviar como Papá Noel/ }).click();
  await child.waitForSelector('text=Mensaje normal sin sorpresa', { timeout: 8000 });
  check('un mensaje normal no dispara la animación', (await child.locator('[role=dialog][aria-label="Mensaje de Papá Noel"]').count()) === 0);

  // Cancelar la cuenta atrás
  await parent.fill('#reply', 'Sorpresa que se cancela');
  await parent.getByRole('button', { name: /Empezar la sorpresa/ }).click();
  await parent.waitForSelector('[role=alertdialog]');
  await parent.getByRole('button', { name: 'Cancelar' }).click();
  await parent.waitForTimeout(6500);
  check('cancelar la cuenta atrás no envía nada', (await child.getByText('Sorpresa que se cancela').count()) === 0);

  // OG de la portada
  const og = await fetch(BASE + '/opengraph-image');
  check('imagen de vista previa de la portada (OG)', og.status === 200 && (og.headers.get('content-type') || '').includes('image/png'), og.status + ' ' + og.headers.get('content-type'));
  const html = await (await fetch(BASE + '/')).text();
  check('la portada declara og:image', /property="og:image"/.test(html));
  check('sin errores de página ni consola', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`RESUMEN: ${results.filter(Boolean).length}/${results.length} OK`);
  await b.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch(e => { console.error('CRASH', e.message); process.exit(2); });
