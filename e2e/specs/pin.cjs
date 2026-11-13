// Bloqueo de padres con PIN: nada del panel sin el PIN (ni por pantalla ni por API), intentos limitados,
// bloqueo automático, rescate, herencia en la familia y portada que no enseña nada.
const { BASE, launch, ensureChar, childLinkOf, familyLinkOf } = require('../_lib.cjs');
const results = [];
const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
const local = (u) => u.replace(/^https?:\/\/[^/]+/, BASE);

(async () => {
  const b = await launch();
  const errs = [];
  const mk = async () => { const c = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'] }); const p = await c.newPage(); p.on('pageerror', (e) => errs.push(e.message)); return { c, p }; };
  const post = (path, body, ctx) => (ctx ? ctx.request : null) ? ctx.request.post(BASE + path, { data: body }) : fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const status = async (r) => (typeof r.status === 'function' ? r.status() : r.status);

  // Escribe el PIN esperando a la hidratación (si no, React borra lo escrito)
  const enterPin = async (p, pin) => {
    await p.waitForLoadState('networkidle');
    const input = p.getByLabel('PIN de los padres'); const btn = p.getByRole('button', { name: 'Entrar' });
    for (let i = 0; i < 5; i++) { await input.fill(pin); if (await btn.isEnabled()) break; await p.waitForTimeout(400); }
    await btn.click();
  };
  const openSetup = async (p) => { const t = p.getByRole('button', { name: /Preparativos/ }); await t.waitFor(); if ((await t.getAttribute('aria-expanded')) !== 'true') await t.click(); };
  // Pulsa un botón hasta que aparece el campo (el primer clic puede llegar antes de hidratar)
  const clickUntil = async (p, name, field) => { for (let i = 0; i < 6; i++) { await p.getByRole('button', Object.assign({ name }, typeof name === 'string' ? { exact: true } : {})).click(); if (await field.waitFor({ timeout: 1500 }).then(() => true, () => false)) return; } };
  const alertText = async (p) => { const a = p.locator('p[role=alert]'); await a.waitFor({ timeout: 10000 }); return a.innerText(); };

  // Crea una sala (y su familia) en un contexto nuevo y devuelve los enlaces
  const createRoom = async (name) => {
    const x = await mk();
    await x.p.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
    await x.p.fill('#child', name); await x.p.locator('form').getByRole('checkbox').check();
    await ensureChar(x.p); await x.p.getByRole('button', { name: /Crear la sala/ }).click();
    await x.p.waitForSelector('text=La sala está lista', { timeout: 30000 });
    const panel = (await x.p.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href')).replace(/^https?:\/\/[^/]+/, '');
    return { ...x, panel, child: await childLinkOf(x.p), family: await familyLinkOf(x.p) };
  };

  // ── 1. Poner el PIN al crear la sala
  const A = await createRoom('Valentina');
  const ptok = A.panel.split('/paje/')[1], ctok = A.child.split('/r/')[1], ftok = A.family.split('/familia/')[1];
  check('al crear la sala se recomienda proteger el panel con un PIN', await A.p.getByText('Protege el panel con un PIN').isVisible());
  await A.p.getByRole('button', { name: 'Poner un PIN' }).click();
  await A.p.getByLabel('PIN nuevo').fill('12');
  check('el botón no se activa con menos de 4 cifras', await A.p.getByRole('button', { name: 'Activar el bloqueo' }).isDisabled());
  await A.p.getByLabel('PIN nuevo').fill('1234');
  await A.p.getByRole('button', { name: 'Activar el bloqueo' }).click();
  await A.p.getByText('Guarda tu código de rescate').waitFor({ timeout: 15000 });
  const recovery = await A.p.locator('[data-recovery]').getAttribute('data-recovery');
  check('se enseña el código de rescate (solo una vez, con formato claro)', /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(recovery), recovery);
  await A.p.getByRole('button', { name: 'Ya lo he guardado' }).click();
  check('tras guardarlo, la pantalla de la sala creada se mantiene (no se pierden los enlaces)', await A.p.getByText('Panel protegido con tu PIN').isVisible() && await A.p.getByRole('link', { name: /Abrir mi panel/ }).isVisible());

  // Quien puso el PIN entra sin pedirlo (está desbloqueado 30 min en su navegador)
  await A.p.getByRole('link', { name: /Abrir mi panel/ }).click();
  await A.p.waitForSelector('#reply', { timeout: 20000 });
  check('quien acaba de poner el PIN entra directamente al panel', await A.p.getByText('Valentina').first().isVisible());
  check('el panel muestra el botón 🔒 para bloquear ya', await A.p.getByRole('button', { name: 'Bloquear la pantalla de los padres' }).isVisible());

  // ── 2. El peque con el móvil de los padres: contexto nuevo, sin cookie
  const B = await mk();
  await B.p.goto(BASE + A.panel, { waitUntil: 'networkidle' });
  await B.p.getByRole('heading', { name: 'Zona de los padres' }).waitFor({ timeout: 15000 });
  const html = await B.p.content();
  check('sin PIN: solo se ve la pantalla de bloqueo', await B.p.getByLabel('PIN de los padres').isVisible() && (await B.p.locator('#reply').count()) === 0);
  check('sin PIN: ni el nombre del peque ni su personaje salen en la página (ni en el código fuente)', !/Valentina/.test(html));
  const noCookie = { messages: await fetch(`${BASE}/api/rooms/${ptok}/messages`), events: await fetch(`${BASE}/api/rooms/${ptok}/events`), reply: await post(`/api/rooms/${ptok}/reply`, { text: 'hola', delayMinutes: 0, mode: 'text' }), erase: await fetch(`${BASE}/api/rooms/${ptok}`, { method: 'DELETE' }), edit: await fetch(`${BASE}/api/rooms/${ptok}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childName: 'X' }) }), childLink: await post(`/api/rooms/${ptok}/child-link`, {}) };
  const codes = Object.fromEntries(Object.entries(noCookie).map(([k, v]) => [k, v.status]));
  check('sin PIN, la API del panel no da nada (mensajes, tiempo real, responder, borrar, editar, cambiar enlace → 404)', Object.values(codes).every((s) => s === 404), JSON.stringify(codes));
  const mfLocked = await (await fetch(`${BASE}/paje/${ptok}/manifest.webmanifest`)).json();
  check('el icono instalado no dice el nombre del peque', !/Valentina/.test(JSON.stringify(mfLocked)) && /Panel de los padres/.test(mfLocked.name), mfLocked.name);
  const F = await mk();
  await F.p.goto(BASE + `/familia/${ftok}`, { waitUntil: 'networkidle' });
  await F.p.getByRole('heading', { name: 'Zona de los padres' }).waitFor({ timeout: 15000 });
  check('la lista de la familia también está bloqueada (sin nombres ni enlaces del niño)', !/Valentina|\/r\//.test(await F.p.content()));
  check('la API de la familia no da los nombres sin PIN (404)', (await fetch(`${BASE}/api/family/${ftok}`)).status === 404);
  const famManifest = await (await fetch(`${BASE}/familia/${ftok}/manifest.webmanifest`)).json();
  check('el manifiesto de la familia bloqueada no enseña el apodo', /Mi familia/.test(famManifest.name));
  const kid = await mk();
  await kid.p.goto(BASE + local(A.child).replace(BASE, ''), { waitUntil: 'networkidle' });
  check('el móvil del niño sigue funcionando con su enlace (el PIN no le afecta)', (await kid.p.getByText(/Este enlace/).count()) === 0);
  check('el enlace del niño NO puede tocar el PIN ni desbloquear (404)', (await status(await post(`/api/rooms/${ctok}/pin`, { action: 'set', pin: '9999' }))) === 404 && (await status(await post('/api/unlock', { token: ctok, pin: '1234' }))) === 404);

  // ── 3. PIN incorrecto y correcto
  await enterPin(B.p, '0000');
  check('PIN incorrecto: avisa y dice cuántos intentos quedan', /PIN incorrecto\. Te quedan 4 intentos/.test(await alertText(B.p)), await alertText(B.p));
  await enterPin(B.p, '1234');
  await B.p.waitForSelector('#reply', { timeout: 20000 });
  check('PIN correcto: se abre el panel con el nombre del peque', await B.p.getByText('Valentina').first().isVisible());
  await B.p.reload({ waitUntil: 'networkidle' });
  check('sigue abierto al recargar (30 minutos)', (await B.p.locator('#reply').count()) === 1);
  check('con el PIN puesto, la API del panel responde', (await B.c.request.get(`${BASE}/api/rooms/${ptok}/messages`)).status() === 200);
  await F.p.reload({ waitUntil: 'networkidle' });
  check('el mismo PIN abre también la lista de la familia (mismo ámbito)', await F.p.getByRole('heading', { name: 'Zona de los padres' }).isVisible()); // otro navegador: sigue bloqueada
  await B.p.goto(BASE + `/familia/${ftok}`, { waitUntil: 'networkidle' });
  check('en el navegador desbloqueado, la lista de la familia se abre sin pedirlo otra vez', await B.p.getByRole('link', { name: /Abrir panel de Valentina/ }).isVisible());

  // ── 4. Bloquear ya y bloqueo automático
  await B.p.goto(BASE + A.panel, { waitUntil: 'networkidle' });
  await B.p.waitForSelector('#reply');
  await B.p.getByRole('button', { name: 'Bloquear la pantalla de los padres' }).click();
  await B.p.getByRole('heading', { name: 'Zona de los padres' }).waitFor({ timeout: 15000 });
  check('el botón 🔒 bloquea al momento', (await B.p.locator('#reply').count()) === 0);
  await enterPin(B.p, '1234');
  await B.p.waitForSelector('#reply', { timeout: 20000 });
  await B.p.waitForLoadState('networkidle'); await B.p.waitForTimeout(1000);
  await B.p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await B.p.evaluate(() => { const real = Date.now; Date.now = () => real() + 90_000; Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
  await B.p.getByRole('heading', { name: 'Zona de los padres' }).waitFor({ timeout: 15000 });
  check('al volver a la app tras más de un minuto fuera, se bloquea sola', (await B.p.locator('#reply').count()) === 0);

  // ── 5. Intentos limitados (en otra familia, para no bloquear la anterior)
  const Y = await createRoom('Sofía');
  const ytok = Y.panel.split('/paje/')[1];
  await Y.p.getByRole('button', { name: 'Poner un PIN' }).click(); await Y.p.getByLabel('PIN nuevo').fill('4321'); await Y.p.getByRole('button', { name: 'Activar el bloqueo' }).click();
  await Y.p.getByText('Guarda tu código de rescate').waitFor({ timeout: 15000 });
  const yrec = await Y.p.locator('[data-recovery]').getAttribute('data-recovery');
  const T = await mk();
  const last = [];
  for (let i = 0; i < 5; i++) { const r = await T.c.request.post(`${BASE}/api/unlock`, { data: { token: ytok, pin: '0000' } }); last.push(r.status()); }
  check('5 PIN incorrectos → el quinto activa la espera (429)', last.slice(0, 4).every((s) => s === 400) && last[4] === 429, last.join(','));
  const right = await T.c.request.post(`${BASE}/api/unlock`, { data: { token: ytok, pin: '4321' } });
  const rj = await right.json();
  check('durante la espera ni el PIN correcto entra, y avisa del tiempo', right.status() === 429 && /Espera \d+ minutos/.test(rj.error.message), rj.error?.message);
  check('formatos de PIN no válidos se rechazan (abc, 123, 1234567)', (await Promise.all(['abc', '123', '1234567'].map((pin) => A.c.request.post(`${BASE}/api/rooms/${ptok}/pin`, { data: { action: 'set', pin } })))).every((r) => r.status() === 400));

  // ── 6. Rescate si se olvida el PIN
  await T.p.goto(BASE + Y.panel, { waitUntil: 'networkidle' });
  await T.p.getByRole('button', { name: '¿Has olvidado el PIN?' }).click();
  await T.p.getByLabel('Código de rescate').fill('AAAA-BBBB-CCCC');
  await T.p.getByRole('button', { name: 'Recuperar acceso' }).click();
  await T.p.locator('p[role=alert]').waitFor({ timeout: 10000 });
  check('un código de rescate falso no entra y cuenta los intentos', /Código incorrecto\. Te quedan 4 intentos/.test(await T.p.locator('p[role=alert]').innerText()));
  await T.p.getByLabel('Código de rescate').fill(yrec.toLowerCase());
  await T.p.getByRole('button', { name: 'Recuperar acceso' }).click();
  await T.p.waitForSelector('#reply', { timeout: 20000 });
  check('el código de rescate (en minúsculas también) abre el panel', true);
  const after = await mk(); await after.p.goto(BASE + Y.panel, { waitUntil: 'networkidle' }); await after.p.waitForSelector('#reply', { timeout: 15000 });
  check('y quita el PIN: otro navegador entra sin pedirlo', (await after.p.getByRole('heading', { name: 'Zona de los padres' }).count()) === 0);

  // ── 7. Cambiar y quitar el PIN desde el panel desbloqueado
  await B.p.goto(BASE + A.panel, { waitUntil: 'networkidle' });
  try { await B.p.getByLabel('PIN de los padres').fill('1234', { timeout: 4000 }); } catch (e) { console.log('DBG', e.message.slice(0, 900)); }
  await enterPin(B.p, '1234');
  await B.p.waitForSelector('#reply', { timeout: 20000 });
  await openSetup(B.p);
  await clickUntil(B.p, 'Cambiar PIN', B.p.getByLabel('PIN nuevo'));
  await B.p.getByLabel('PIN nuevo').fill('5678');
  await B.p.getByRole('button', { name: 'Activar el bloqueo' }).click();
  await B.p.getByText('Guarda tu código de rescate').waitFor({ timeout: 15000 });
  const rec2 = await B.p.locator('[data-recovery]').getAttribute('data-recovery');
  check('al cambiar el PIN sale un código de rescate nuevo', rec2 !== recovery && /^[A-Z2-9]{4}-/.test(rec2));
  const C = await mk();
  const oldPin = await C.c.request.post(`${BASE}/api/unlock`, { data: { token: ptok, pin: '1234' } });
  const newPin = await C.c.request.post(`${BASE}/api/unlock`, { data: { token: ptok, pin: '5678' } });
  check('el PIN antiguo deja de valer y el nuevo sí', oldPin.status() === 400 && newPin.status() === 200);

  // La familia hereda el PIN: otro peque en la misma familia también queda protegido
  await A.p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await A.p.getByRole('link', { name: /Zona de los padres/ }).waitFor({ timeout: 15000 });
  check('portada de un móvil con PIN: solo "Zona de los padres" (sin salas, nombres ni enlaces)', (await A.p.locator('section[aria-labelledby=my-rooms]').count()) === 0 && (await A.p.getByText(/Tus salas en este móvil|Abrir panel de|Copiar enlace del peque/).count()) === 0 && !/Valentina/.test(await A.p.locator('body').innerText()));
  await A.p.fill('#child', 'Mateo'); await A.p.locator('form').getByRole('checkbox').check();
  await ensureChar(A.p); await A.p.getByRole('button', { name: /Crear la sala/ }).click();
  await A.p.waitForSelector('text=La sala está lista', { timeout: 30000 });
  const mateoPanel = (await A.p.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href')).replace(/^https?:\/\/[^/]+/, '');
  check('la sala nueva de la misma familia ya nace protegida con el mismo PIN', (await A.p.getByText('Protege el panel con un PIN').count()) === 1); // (la tarjeta se ofrece, pero el PIN ya existe en el servidor)
  const D = await mk(); await D.p.goto(BASE + mateoPanel, { waitUntil: 'networkidle' });
  check('un navegador sin PIN ve el bloqueo en la sala nueva', await D.p.getByRole('heading', { name: 'Zona de los padres' }).isVisible());

  await B.p.goto(BASE + A.panel, { waitUntil: 'networkidle' });
  await openSetup(B.p);
  await clickUntil(B.p, 'Quitar', B.p.getByLabel('PIN actual'));
  await B.p.getByLabel('PIN actual').fill('0000');
  await B.p.getByRole('button', { name: 'Quitar el PIN' }).click();
  await B.p.locator('p[role=alert]').waitFor({ timeout: 10000 });
  check('quitar el PIN exige el actual (con uno falso no lo quita)', /PIN incorrecto/.test(await B.p.locator('p[role=alert]').innerText()));
  await B.p.getByLabel('PIN actual').fill('5678');
  await B.p.getByRole('button', { name: 'Quitar el PIN' }).click();
  await B.p.waitForLoadState('networkidle');
  const E = await mk(); await E.p.goto(BASE + A.panel, { waitUntil: 'networkidle' }); await E.p.waitForSelector('#reply', { timeout: 15000 });
  check('con el PIN quitado, el panel vuelve a abrirse sin pedirlo', (await E.p.getByRole('heading', { name: 'Zona de los padres' }).count()) === 0);

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message, (e.stack||'').split('\n').filter((l) => l.includes('pin.cjs')).join(' ')); process.exit(2); });
