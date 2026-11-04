const { OUT: S, FIX, BASE, launch } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await launch(['--no-sandbox']);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('page:' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text().slice(0, 3000)); });

  // Portada
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  check('titular de la mañana de regalos', await page.getByRole('heading', { name: /antes de abrir los regalos/i }).isVisible());
  const scrollContainer = page.locator('div.fixed.inset-0.overflow-y-auto');
  const scrollTop0 = await scrollContainer.evaluate(el => el.scrollTop);
  check('la portada no se desplaza sola al cargar el chat de ejemplo', scrollTop0 === 0, 'scrollTop=' + scrollTop0);
  check('chat de ejemplo con Papá Noel visible', await page.getByText('Feliz Navidad, Lucía').isVisible());
  await page.screenshot({ path: S + '/l1-landing-top.png' });
  // Interactuar con el ejemplo
  await page.fill('#royal-draft', '¿Has traído la bici?'); await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const afterSend = await scrollContainer.evaluate(el => el.scrollTop);
  await page.waitForSelector('text=Qué bonito lo que me cuentas', { timeout: 8000 }).then(() => check('el chat de ejemplo contesta al escribir', true)).catch(() => check('el chat de ejemplo contesta al escribir', false));
  await page.waitForTimeout(600);
  const afterReply = await scrollContainer.evaluate(el => el.scrollTop);
  check('al llegar la respuesta, la portada no salta (el chat se desplaza por dentro)', Math.abs(afterReply - afterSend) < 4, afterSend + ' → ' + afterReply);
  await scrollContainer.evaluate(el => el.scrollTo(0, 620));
  await page.waitForTimeout(300);
  await page.screenshot({ path: S + '/l2-landing-form.png' });
  check('el formulario de la sala sigue funcionando', await page.locator('#child').isVisible());

  // Panel: momentos + wake lock
  await page.evaluate(() => { window.__wl = 0; Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => { window.__wl++; return { release: async () => {} }; } } }); });
  await page.fill('#child', 'Lucía'); await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Crear la sala/ }).click();
  await page.waitForSelector('text=La sala real está lista');
  const pajeHref = await page.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const panel = await ctx.newPage();
  await panel.addInitScript(() => { window.__wl = 0; Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => { window.__wl++; return { release: async () => {} }; } } }); });
  await panel.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  await panel.waitForTimeout(500);
  check('el panel pide mantener la pantalla encendida', (await panel.evaluate(() => window.__wl)) >= 1);
  const tabs = await panel.getByRole('tab').allInnerTexts();
  check('momentos de Papá Noel: Primer saludo, Cosas del taller, Charla, Nochebuena, Mañana de Navidad', tabs.join('|') === 'Primer saludo|Cosas del taller|Charla|Nochebuena|Mañana de Navidad', tabs.join('|'));
  await panel.getByRole('tab', { name: 'Mañana de Navidad' }).click();
  check('aparece el consejo del modo sorpresa', await panel.getByText(/modo sorpresa para el mensaje de abrir los regalos/).isVisible());
  await panel.getByRole('button', { name: /Ya puedes abrir los regalos, Lucía/ }).click();
  check('al elegir un mensaje, se rellena con el nombre del niño', (await panel.locator('#reply').inputValue()).includes('¡Ya puedes abrir los regalos, Lucía!'));
  check('el botón de sorpresa se activa con ese mensaje', await panel.getByRole('button', { name: /Empezar la sorpresa/ }).isEnabled());
  await panel.screenshot({ path: S + '/l3-panel-moments.png' });
  check('sin errores de página ni consola', errs.length === 0, errs.slice(0, 3).map(x=>x.slice(0,1500)).join(' | '));
  console.log(`RESUMEN: ${results.filter(Boolean).length}/${results.length} OK`);
  await b.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch(e => { console.error('CRASH', e.message); process.exit(2); });
