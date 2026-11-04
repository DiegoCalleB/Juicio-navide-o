const { OUT: S, FIX, BASE, launch } = require('../_lib.cjs');
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok: !!ok, extra }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  → ' + extra : '')); };

(async () => {
  await require('../_lib.cjs').ensureFixtures();
  const b = await launch(['--no-sandbox']);
  const errs = [];
  const newCtx = () => b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const parentCtx = await newCtx();
  const childCtx = await newCtx();
  const parent = await parentCtx.newPage();
  const child = await childCtx.newPage();
  for (const [n, p] of [['parent', parent], ['child', child]]) {
    p.on('pageerror', e => errs.push(n + ':' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(n + ':console:' + m.text().slice(0, 160)); });
  }

  // ── 1. Selección de personajes y creación de la sala
  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.screenshot({ path: S + '/p1-landing.png' });
  check('selector: Papá Noel y los 3 Reyes visibles', await parent.getByText('Papá Noel').first().isVisible() && await parent.getByText('Baltasar').first().isVisible());
  await parent.fill('#child', 'Lucía');
  // Papá Noel viene preseleccionado
  check('Papá Noel preseleccionado', await parent.getByRole('radio', { name: /Papá Noel/ }).isChecked());
  await parent.getByRole('checkbox').check();
  await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala real está lista', { timeout: 30000 });
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await parent.locator('p.font-mono').first().innerText()).trim();
  check('se generan enlaces de niño y padres', /\/paje\/[\w-]{43}$/.test(pajeHref) && /\/r\/[\w-]{43}$/.test(childLink), pajeHref.slice(-12));
  const childToken = childLink.split('/r/')[1];
  const parentToken = pajeHref.split('/paje/')[1];

  // ── 2/3. Pantallas de niño y padres
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle', timeout: 60000 });
  await child.goto(childLink.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: 'networkidle', timeout: 60000 });
  check('niño: cabecera con el personaje', await child.getByText('Papá Noel').first().isVisible() && await child.getByText('desde el Polo Norte').isVisible());
  check('padres: contestan como Papá Noel a Lucía', await parent.getByText('Contestas como Papá Noel a Lucía').isVisible());
  await parent.waitForSelector('[role=status][aria-label="Conectado en tiempo real"]', { timeout: 10000 }).then(() => check('padres: conectado en tiempo real (SSE)', true)).catch(() => check('padres: conectado en tiempo real (SSE)', false));
  await child.waitForSelector('#royal-draft', { timeout: 10000 });

  await fetch(BASE + '/api/rooms/x/message', { method: 'POST' }); await fetch(BASE + '/api/rooms/x/typing', { method: 'POST' }); // calienta rutas del modo desarrollo
  // ── 4. Tiempo real niño → padres
  await child.fill('#royal-draft', 'Querido Papá Noel, quiero una bici roja');
  await parent.waitForSelector('text=Lucía está escribiendo', { timeout: 6000 }).then(() => check('padres ven "Lucía está escribiendo…" en vivo', true)).catch(() => check('padres ven "Lucía está escribiendo…" en vivo', false));
  const t0 = Date.now();
  await child.keyboard.press('Enter');
  await parent.waitForSelector('text=quiero una bici roja', { timeout: 8000 });
  const latency = Date.now() - t0;
  check('mensaje del niño llega a los padres en < 2 s', latency < 2000, latency + ' ms');
  await child.waitForSelector('text=vuela hacia el Polo Norte', { timeout: 8000 }).then(() => check('niño recibe el aviso "Papá Noel está ocupado"', true)).catch(() => check('niño recibe el aviso "Papá Noel está ocupado"', false));
  await parent.waitForTimeout(500);
  await parent.screenshot({ path: S + '/p2-parent-got-message.png' });

  // ── Tiempo real padres → niño (+ typing)
  await parent.fill('#reply', 'Jo, jo, jo! Una bici roja, qué buena idea, Lucía');
  await child.waitForSelector('text=escribiendo…', { timeout: 6000 }).then(() => check('niño ve "escribiendo…" en vivo mientras los padres teclean', true)).catch(() => check('niño ve "escribiendo…" en vivo mientras los padres teclean', false));
  await child.screenshot({ path: S + '/p3-child-sees-typing.png' });
  const t1 = Date.now();
  await parent.getByRole('button', { name: /Enviar como Papá Noel/ }).click();
  await child.waitForSelector('text=qué buena idea, Lucía', { timeout: 8000 });
  const lat2 = Date.now() - t1;
  check('respuesta de los padres llega al niño en < 2.5 s', lat2 < 2500, lat2 + ' ms');
  await child.waitForTimeout(400);
  await child.screenshot({ path: S + '/p4-child-got-reply.png' });

  // ── 5. Fotos en ambos sentidos
  await child.getByTestId('photo-input').setInputFiles(FIX + '/foto-nino.jpg');
  await parent.waitForSelector('img[alt="Foto"]', { timeout: 15000 });
  const imgOk = await parent.evaluate(async () => { const i = document.querySelector('img[alt="Foto"]'); await i.decode().catch(() => {}); return i.naturalWidth; });
  check('foto del niño llega a los padres (se decodifica)', imgOk > 0, imgOk + ' px de ancho');
  check('la foto se comprimió (≤ 960 px)', imgOk <= 960 && imgOk > 100, String(imgOk));

  await parent.getByTestId('photo-input').setInputFiles(FIX + '/foto-padres.png');
  await parent.waitForSelector('text=Foto lista', { timeout: 10000 });
  await parent.fill('#reply', 'Mira lo que han dibujado mis duendes');
  await parent.getByRole('button', { name: /Enviar foto como Papá Noel/ }).click();
  await child.waitForSelector('text=mis duendes', { timeout: 15000 });
  const childImg = await child.evaluate(async () => { const i = [...document.querySelectorAll('img')].find(x => /dev-media\/media/.test(x.src) && x.alt.includes('duendes')); await i.decode().catch(() => {}); return i.naturalWidth; });
  check('foto de los padres llega al niño con su pie de foto', childImg > 0, childImg + ' px');
  await child.locator('button[aria-label="Ver la foto en grande"]').last().click();
  check('visor de foto en grande', await child.getByRole('dialog', { name: 'Foto' }).isVisible());
  await child.screenshot({ path: S + '/p5-child-photo.png' });
  await child.getByRole('button', { name: 'Cerrar' }).click();

  // ── 6. Entrega diferida
  await parent.fill('#reply', 'Mensaje con retraso de dos minutos');
  await parent.getByRole('radio', { name: '2 min' }).click();
  await parent.getByRole('button', { name: /Enviar como Papá Noel/ }).click();
  await parent.waitForSelector('text=Se entregará a las', { timeout: 8000 });
  await child.waitForTimeout(2500);
  check('mensaje diferido NO llega todavía al niño', (await child.getByText('retraso de dos minutos').count()) === 0);
  await parent.screenshot({ path: S + '/p6-parent-panel.png' });

  // ── 7. Permisos y seguridad de la API
  const api = async (method, path, opts = {}) => { const r = await fetch(BASE + path, { method, ...opts }); return r.status; };
  check('token inválido → 404', (await api('GET', '/api/rooms/token-invalido/messages')) === 404);
  check('el niño NO puede usar la ruta de los padres (/reply)', (await api('POST', `/api/rooms/${childToken}/reply`, { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'hola', delayMinutes: 0 }) })) === 404);
  check('los padres NO pueden escribir como niño (/message)', (await api('POST', `/api/rooms/${parentToken}/message`, { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'hola' }) })) === 404);
  check('audio sin archivo → 400 (validación)', (await api('POST', `/api/rooms/${childToken}/voice`, { body: new FormData() })) === 400);
  const fd = new FormData(); fd.append('image', new Blob(['no soy una imagen'], { type: 'image/jpeg' }), 'x.jpg');
  check('foto falsa (bytes no son JPEG) → rechazada', (await api('POST', `/api/rooms/${childToken}/photo`, { body: fd })) >= 400);
  const big = new FormData(); big.append('image', new Blob([new Uint8Array(2_000_000)], { type: 'image/webp' }), 'x.webp');
  check('foto demasiado grande → 413', (await api('POST', `/api/rooms/${childToken}/photo`, { body: big })) === 413);
  check('el niño NO ve mensajes diferidos vía API', !(await (await fetch(`${BASE}/api/rooms/${childToken}/messages`)).text()).includes('retraso de dos minutos'));
  check('los padres SÍ los ven vía API', (await (await fetch(`${BASE}/api/rooms/${parentToken}/messages`)).text()).includes('retraso de dos minutos'));
  const xss = await fetch(`${BASE}/api/rooms/${childToken}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: '<img src=x onerror=alert(1)> hola' }) });
  const list = await (await fetch(`${BASE}/api/rooms/${parentToken}/messages`)).text();
  check('HTML en el texto se sanea (sin < ni >)', xss.status === 201 && !/<img/.test(list));
  check('cleanup sin secreto → 401', (await api('POST', '/api/cron/cleanup')) === 401);
  check('cleanup con secreto → 200', (await api('POST', '/api/cron/cleanup', { headers: { Authorization: 'Bearer testsecret-testsecret-1234' } })) === 200);
  check('dev-media sirve archivos solo en memoria (ruta inexistente → 404)', (await api('GET', '/api/dev-media/media/no/existe.jpg')) === 404);
  const csp = (await fetch(BASE + '/')).headers.get('content-security-policy') || '';
  check('cabecera CSP presente', csp.includes("default-src 'self'"));

  // ── 8. Reconexión: el cliente sigue funcionando tras cortar la red un momento
  await parentCtx.setOffline(true); await parent.waitForTimeout(800); await parentCtx.setOffline(false);
  await child.fill('#royal-draft', 'Mensaje tras reconexión'); await child.keyboard.press('Enter');
  await parent.waitForSelector('text=tras reconexión', { timeout: 15000 }).then(() => check('los padres se reconectan solos y reciben el mensaje', true)).catch(() => check('los padres se reconectan solos y reciben el mensaje', false));

  // ── 9. Mensaje diferido llega a los ~2 min (sin recargar)
  console.log('… esperando la entrega diferida (2 min)');
  const t2 = Date.now();
  await child.waitForSelector('text=retraso de dos minutos', { timeout: 150000 }).then(() => check('el mensaje diferido llega al niño a su hora (sin recargar)', true, Math.round((Date.now() - t2) / 1000) + ' s tras comprobar')).catch(() => check('el mensaje diferido llega al niño a su hora (sin recargar)', false));
  await child.screenshot({ path: S + '/p7-child-final.png' });

  check('sin errores de página ni de consola', errs.length === 0, errs.slice(0, 3).join(' | '));
  const failed = results.filter(r => !r.ok);
  console.log(`\nRESUMEN: ${results.length - failed.length}/${results.length} pruebas OK`);
  if (failed.length) console.log('FALLOS:', failed.map(f => f.name).join(' ; '));
  await b.close();
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('CRASH', e.message); process.exit(2); });
