// Correo de los padres: enlace guardado por correo, consentimiento de novedades separado, baja que borra,
// límites, CSRF, y que ningún correo ni la página de baja delaten la magia.
const { BASE, launch, ensureChar, childLinkOf, familyLinkOf } = require('../_lib.cjs');
const results = [];
const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
const DELATAN = /pap[aá] noel|trastada|no es real|no son reales|los padres (contestan|escriben)|mensaje programado|\bIA\b|inteligencia artificial/i;

(async () => {
  const b = await launch();
  const c = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await c.newPage();
  await p.goto(BASE + '/crear', { waitUntil: 'networkidle', timeout: 120000 });
  await p.fill('#child', 'Valentina'); await p.locator('form').getByRole('checkbox').check();
  await ensureChar(p); await p.getByRole('button', { name: /Abrir el portal/ }).click();
  await p.waitForSelector('text=El portal está abierto', { timeout: 30000 });
  const panel = (await p.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href')).replace(/^https?:\/\/[^/]+/, '');
  const ptok = panel.split('/paje/')[1];
  const ctok = (await childLinkOf(p)).split('/r/')[1];
  const ftok = (await familyLinkOf(p)).split('/familia/')[1];

  const post = (path, body, headers = {}) => fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const box = async () => (await (await fetch(BASE + '/api/dev-outbox')).json());

  check('el correo está activo', (await (await fetch(BASE + '/api/contacto')).json()).data.enabled === true);
  // El servidor de pruebas compila cada ruta al visitarla por primera vez y eso reinicia los contadores en memoria:
  // se visitan todas antes de medir los límites.
  await box(); await post('/api/baja', { e: 'x', s: 'y' });

  // 1. Con el enlace de familia, sin novedades
  let r = await post('/api/contacto', { token: ftok, email: 'Madre@Ejemplo.com ', marketing: false });
  let d = await box();
  const m1 = d.outbox.find((m) => m.to === 'madre@ejemplo.com');
  check('familia: se envía y el correo se normaliza', r.status === 200 && !!m1);
  check('familia: el correo lleva el enlace de familia', !!m1 && m1.text.includes(`/familia/${ftok}`));
  check('sin consentimiento: no hay enlace de baja ni cabeceras de novedades', !!m1 && !/\/baja\?/.test(m1.text) && !m1.unsubscribeUrl);
  check('sin consentimiento: queda guardado sin «sí» a novedades', d.contacts.some((x) => x.email === 'madre@ejemplo.com' && x.marketingOptIn === false));

  // 2. Con el enlace del panel, aceptando novedades
  r = await post('/api/contacto', { token: ptok, email: 'padre@ejemplo.com', marketing: true });
  d = await box();
  const m2 = d.outbox.find((m) => m.to === 'padre@ejemplo.com');
  check('panel: el correo lleva el enlace del panel', r.status === 200 && !!m2 && m2.text.includes(`/paje/${ptok}`));
  check('con consentimiento: lleva enlace de baja', !!m2 && /\/baja\?e=/.test(m2.text) && !!m2.unsubscribeUrl);
  check('con consentimiento: queda guardado con el «sí»', d.contacts.some((x) => x.email === 'padre@ejemplo.com' && x.marketingOptIn === true));

  // 3. El enlace del niño nunca sirve; datos inválidos
  check('con el enlace del niño: 404 (y no se envía nada)', (await post('/api/contacto', { token: ctok, email: 'peque@ejemplo.com' })).status === 404 && !(await box()).outbox.some((m) => m.to === 'peque@ejemplo.com'));
  check('correo inválido: 400', (await post('/api/contacto', { token: ftok, email: 'esto-no-es-un-correo' })).status === 400);
  check('enlace inventado: 404', (await post('/api/contacto', { token: 'A'.repeat(43), email: 'x@ejemplo.com' })).status === 404);

  // 4. Ningún correo delata la magia ni lleva nombres de niños
  const all = (await box()).outbox.map((m) => `${m.subject}\n${m.text}\n${m.html}`).join('\n');
  check('los correos no delatan la magia ni llevan el nombre del peque', !DELATAN.test(all) && !/Valentina/.test(all));

  // 5. Límite diario por familia (3) y CSRF
  check('3.º correo de la familia: se envía', (await post('/api/contacto', { token: ftok, email: 'abuela@ejemplo.com' })).status === 200);
  const r4 = await post('/api/contacto', { token: ftok, email: 'tia@ejemplo.com' }); check('4.º correo de la familia en el día: 429', r4.status === 429, String(r4.status) + ' ' + (await r4.text()).slice(0, 120));
  check('CSRF: desde otro origen se rechaza', (await post('/api/contacto', { token: ftok, email: 'z@ejemplo.com' }, { Origin: 'https://sitio-ajeno.example' })).status === 403);

  // 6. Baja
  const unsub = (await box()).outbox.find((m) => m.to === 'padre@ejemplo.com').unsubscribeUrl;
  const u = new URL(unsub);
  check('baja: un enlace manipulado no borra nada', (await post('/api/baja', { e: u.searchParams.get('e'), s: 'x'.repeat(43) })).status === 400);
  const pg = await c.newPage();
  await pg.goto(BASE + u.pathname + u.search, { waitUntil: 'networkidle' });
  const bodyText = await pg.locator('body').innerText();
  check('baja: abrir el enlace NO borra (hace falta pulsar)', (await box()).contacts.some((x) => x.email === 'padre@ejemplo.com') && /Darme de baja/.test(bodyText));
  check('baja: la página no delata nada', !DELATAN.test(bodyText) && !/padres|mayores/i.test(bodyText));
  for (let i = 0; i < 6; i++) { await pg.getByRole('button', { name: 'Darme de baja' }).click(); if (await pg.getByText(/hemos borrado tu correo/).waitFor({ timeout: 1500 }).then(() => true, () => false)) break; }
  check('baja: al pulsar se borra el correo por completo', !(await box()).contacts.some((x) => x.email === 'padre@ejemplo.com'));
  check('baja con un clic (POST desde el programa de correo)', (await post(`/api/baja?e=${u.searchParams.get('e')}&s=${u.searchParams.get('s')}`, {})).status === 200);
  const bad = await c.newPage();
  await bad.goto(BASE + '/baja?e=abc&s=def', { waitUntil: 'networkidle' });
  check('baja con enlace inválido: mensaje neutro, sin botón', (await bad.getByRole('button', { name: 'Darme de baja' }).count()) === 0);

  // 6b. Alertas de seguridad al dueño: una clave incorrecta en el panel de métricas avisa (y solo una vez por hora)
  await post('/api/metricas/entrar', { token: 'clave-equivocada' }); // calienta la ruta (los contadores se reinician al compilar)
  const antes = (await box()).outbox.filter((m) => m.to === 'alertas@ejemplo.com').length;
  await post('/api/metricas/entrar', { token: 'otra-clave-equivocada' });
  await post('/api/metricas/entrar', { token: 'y-otra-mas' });
  const alertas = (await box()).outbox.filter((m) => m.to === 'alertas@ejemplo.com');
  check('alerta: una clave incorrecta en las métricas avisa al dueño', alertas.length >= 1 && /métricas/i.test(alertas.at(-1).subject) && /Alerta/.test(alertas.at(-1).subject));
  check('alerta: no se repite durante una hora (sin llenar el buzón)', alertas.length - antes <= 1 && alertas.length <= 1, `${antes} → ${alertas.length}`);
  check('alerta: sin datos personales ni enlaces secretos', !/https?:\/\//.test(alertas.at(-1).text) && !/clave-equivocada/.test(alertas.at(-1).text + alertas.at(-1).html));

  // 7. Interfaz: el formulario aparece en el panel y la casilla de novedades viene SIN marcar
  await p.goto(BASE + panel, { waitUntil: 'networkidle' });
  const form = p.getByRole('region', { name: 'Enlace por correo' });
  await form.waitFor({ timeout: 15000 });
  check('panel: el formulario de correo se ve y la casilla de novedades no viene marcada', (await form.getByRole('checkbox').isChecked()) === false);

  console.log(`RESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message, (e.stack || '').split('\n').slice(0, 6).join(' / ')); process.exit(2); });
