// «Pruébalo gratis»: explica qué recibe el peque y por qué es privado. Vive detrás de la puerta (REGLA DE ORO).
const { BASE, launch } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await launch();
  const errs = [];
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE + '/prueba?src=tt', { waitUntil: 'networkidle', timeout: 120000 });
  check('con la puerta pasada se ve la página', await p.getByRole('heading', { name: /le escribe a tu peque/ }).isVisible());
  check('explica los 3 pasos', (await p.locator('ol li').count()) === 3 && await p.getByText('Abres su portal').isVisible() && await p.getByText('Le das su enlace').isVisible());
  check('dice por qué es privado (5 puntos)', (await p.locator('section[aria-labelledby="seguro"] li').count()) === 5);
  check('enseña lo que recibe el peque (vídeo de la respuesta de Papá Noel)', (await p.locator('video[src="/prueba/carta-lucia.mp4"]').count()) === 1);
  check('hay botón «Pruébalo gratis 3 días» que lleva a crear el portal', (await p.getByRole('link', { name: 'Pruébalo gratis 3 días' }).first().getAttribute('href')) === '/crear');
  await p.screenshot({ path: require('../_lib.cjs').OUT + '/prueba-top.png' }); await p.locator('[data-scroll-root]').evaluate((e) => e.scrollTo(0, 1300)); await p.screenshot({ path: require('../_lib.cjs').OUT + '/prueba-mid.png' });
  const txt = await p.locator('body').innerText();
  check('no pide tarjeta para la prueba', /sin tarjeta/i.test(txt));
  check('dice, detrás de la puerta, que los mensajes los escribe el adulto (lo que hace único al servicio)', /los mensajes los escribes tú/i.test(txt) && /100 % personalizado/i.test(txt));
  // Un peque (sin puerta pasada) no la ve: lo mandan a la pregunta de Chispa; el vídeo tampoco se sirve
  const kb = await launch([], { adult: false });
  const k = await (await kb.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await k.goto(BASE + '/prueba', { waitUntil: 'networkidle' });
  check('sin la puerta, /prueba lleva a la puerta de mayores', /\/mayores/.test(k.url()), k.url());
  const v = await fetch(BASE + '/prueba/carta-lucia.mp4', { redirect: 'manual' });
  check('sin la puerta, el vídeo no se sirve', v.status >= 300 && v.status < 400, String(v.status));
  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close(); await kb.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
