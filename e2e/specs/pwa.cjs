// Instalable como app: iconos, manifiestos (general, sala del niño, panel y familia), service worker y botón de instalar.
const { BASE, launch, ensureChar, childLinkOf, familyLinkOf } = require('../_lib.cjs');
const { devices } = require('playwright');
const results = [];
const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
const pngWidth = (buf) => (buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG' ? buf.readUInt32BE(16) : 0);
const get = async (path) => fetch(BASE + path);

(async () => {
  const b = await launch();
  const errs = [];
  const mk = async (opts = {}) => { const c = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'], ...opts }); const p = await c.newPage(); p.on('pageerror', (e) => errs.push(e.message)); return p; };

  // ── Manifiesto general e iconos
  const mres = await get('/manifest.webmanifest');
  const m = await mres.json();
  check('manifiesto general: nombre, id, inicio y alcance', m.name === 'Línea Mágica' && m.id === '/' && m.scope === '/' && /^\/\?utm_source=pwa/.test(m.start_url), `${m.name} ${m.start_url}`);
  check('manifiesto general: se abre como app (standalone) y sin bloquear la orientación', m.display === 'standalone' && !m.orientation);
  check('manifiesto general: atajos a "Crear sala" y "Trastadas"', (m.shortcuts ?? []).length === 2 && m.shortcuts.some((s) => s.url === '/ideas-elfo'));
  const sizes = {};
  for (const ic of m.icons) { const r = await get(ic.src); sizes[`${ic.sizes}/${ic.purpose}`] = r.status === 200 && /image\/png/.test(r.headers.get('content-type') ?? '') ? pngWidth(Buffer.from(await r.arrayBuffer())) : 0; }
  check('iconos 192, 512 y maskable existen y tienen el tamaño declarado', sizes['192x192/any'] === 192 && sizes['512x512/any'] === 512 && sizes['512x512/maskable'] === 512, JSON.stringify(sizes));
  const fav = await get('/favicon.ico');
  check('favicon.ico disponible', fav.status === 200 && fav.headers.get('content-type')?.includes('icon') !== false);
  const sw = await get('/sw.js'); const swText = await sw.text();
  check('service worker: se sirve y solo gestiona navegaciones (no guarda salas)', sw.status === 200 && /javascript/.test(sw.headers.get('content-type') ?? '') && /mode !== 'navigate'/.test(swText) && !/\/paje|\/familia|\/api/.test(swText.replace(/NO guarda[^]*?caché\)/, '')));
  const off = await get('/offline.html'); const offText = await off.text();
  check('página sin conexión disponible', off.status === 200 && /Se ha cortado la línea mágica/.test(offText) && /Reintentar/.test(offText));

  // ── Cabeceras de la portada
  const page = await mk();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  check('la portada enlaza su manifiesto', ((await page.locator('link[rel=manifest]').first().getAttribute('href')) ?? '').includes('manifest.webmanifest'));
  check('iconos de pestaña y de pantalla de inicio de iPhone', (await page.locator('link[rel=icon]').count()) >= 1 && (await page.locator('link[rel=apple-touch-icon]').count()) >= 1);
  check('aplicación web de iPhone con el nombre de la app', (await page.locator('meta[name=apple-mobile-web-app-title], meta[name="apple-mobile-web-app-title"]').first().getAttribute('content')) === 'Línea Mágica');

  // ── Botón de instalar
  const android = await mk();
  await android.addInitScript(() => {
    window.__prompted = 0;
    const fire = () => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = async () => { window.__prompted++; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); };
    let n = 0; const t = setInterval(() => { fire(); if (++n > 20) clearInterval(t); }, 400);
  });
  await android.goto(BASE + '/', { waitUntil: 'networkidle' });
  await android.getByRole('button', { name: 'Instalar', exact: true }).waitFor({ timeout: 15000 });
  check('Android/ordenador: aparece "Instalar" cuando el navegador lo permite', await android.getByText('Instala Línea Mágica en tu móvil').isVisible());
  await android.getByRole('button', { name: 'Instalar', exact: true }).click();
  await android.waitForTimeout(400);
  check('al pulsar, se abre el diálogo de instalación del navegador', (await android.evaluate(() => window.__prompted)) >= 1);
  check('y tras aceptar, el aviso desaparece', (await android.getByText('Instala Línea Mágica en tu móvil').count()) === 0);

  const dism = await mk();
  await dism.addInitScript(() => { let n = 0; const t = setInterval(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = async () => {}; e.userChoice = Promise.resolve({ outcome: 'dismissed' }); window.dispatchEvent(e); if (++n > 40) clearInterval(t); }, 400); });
  await dism.goto(BASE + '/', { waitUntil: 'networkidle' });
  await dism.getByRole('button', { name: 'No volver a mostrar' }).click();
  await dism.reload({ waitUntil: 'networkidle' }); await dism.waitForTimeout(1500);
  check('al descartarlo, no vuelve a molestar al recargar', (await dism.getByText('Instala Línea Mágica en tu móvil').count()) === 0);

  const inst = await mk();
  await inst.addInitScript(() => {
    const orig = window.matchMedia.bind(window);
    window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false } : orig(q));
    let n = 0; const t = setInterval(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = async () => {}; e.userChoice = Promise.resolve({ outcome: 'dismissed' }); window.dispatchEvent(e); if (++n > 10) clearInterval(t); }, 400);
  });
  await inst.goto(BASE + '/', { waitUntil: 'networkidle' }); await inst.waitForTimeout(1500);
  check('si ya está instalada (modo app), no se ofrece instalarla', (await inst.getByText('Instala Línea Mágica en tu móvil').count()) === 0);

  const ios = await mk({ userAgent: devices['iPhone 13'].userAgent, hasTouch: true, isMobile: true });
  await ios.goto(BASE + '/', { waitUntil: 'networkidle' });
  await ios.getByRole('button', { name: 'Cómo instalarla' }).waitFor({ timeout: 15000 });
  await ios.getByRole('button', { name: 'Cómo instalarla' }).click();
  check('iPhone/iPad: explica los dos pasos ("Añadir a pantalla de inicio")', await ios.getByText('«Añadir a pantalla de inicio»').first().isVisible() && await ios.getByText('Compartir', { exact: false }).first().isVisible());

  // ── Manifiestos de sala, panel y familia
  const p = await mk();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.fill('#child', 'Lucía'); await p.locator('form').getByRole('checkbox').check();
  await ensureChar(p); await p.getByRole('button', { name: /Crear la sala/ }).click();
  await p.waitForSelector('text=La sala está lista', { timeout: 30000 });
  const childLink = await childLinkOf(p); const familyLink = await familyLinkOf(p);
  const panelLink = (await p.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href')).replace(/^https?:\/\/[^/]+/, '');
  const ctok = childLink.split('/r/')[1]; const ptok = panelLink.split('/paje/')[1]; const ftok = familyLink.split('/familia/')[1];

  const cm = await get(`/r/${ctok}/manifest.webmanifest`); const cj = await cm.json();
  check('sala del niño: la app se llama como el personaje y abre su chat', cj.name === 'Papá Noel' && cj.start_url === `/r/${ctok}` && cj.scope === `/r/${ctok}` && cj.display === 'standalone', `${cj.name} ${cj.start_url?.slice(0, 12)}…`);
  const cicons = {}; for (const ic of cj.icons) { const r = await get(ic.src); cicons[ic.sizes + ic.purpose] = r.status === 200 ? pngWidth(Buffer.from(await r.arrayBuffer())) : 0; }
  check('sala del niño: lleva la cara del personaje (192, 512 y maskable)', cicons['192x192any'] === 192 && cicons['512x512any'] === 512 && cicons['512x512maskable'] === 512 && cj.icons.every((i) => /papa_noel/.test(i.src)), JSON.stringify(cicons));
  check('sala del niño: el manifiesto nunca se cachea ni filtra Referer', /no-store/.test(cm.headers.get('cache-control') ?? '') && cm.headers.get('referrer-policy') === 'no-referrer');
  check('el enlace del padre no vale para el manifiesto del niño (404)', (await get(`/r/${ptok}/manifest.webmanifest`)).status === 404);
  check('un enlace inventado no tiene manifiesto (404)', (await get(`/r/${'Z'.repeat(43)}/manifest.webmanifest`)).status === 404);

  const pm = await (await get(`/paje/${ptok}/manifest.webmanifest`)).json();
  check('panel de los padres: la app abre ese panel', /Panel de Lucía/.test(pm.name) && pm.start_url === `/paje/${ptok}`, pm.name);
  check('el enlace del niño no vale para el manifiesto del panel (404)', (await get(`/paje/${ctok}/manifest.webmanifest`)).status === 404);
  const fm = await (await get(`/familia/${ftok}/manifest.webmanifest`)).json();
  check('familia: la app abre todas las salas', /Línea Mágica/.test(fm.name) && fm.start_url === `/familia/${ftok}`, fm.name);
  check('una familia inventada no tiene manifiesto (404)', (await get(`/familia/${'Y'.repeat(43)}/manifest.webmanifest`)).status === 404);

  // Las propias páginas enlazan su manifiesto
  const kid = await mk(); await kid.goto(BASE + childLink.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  check('la sala del niño enlaza SU manifiesto', (await kid.locator('link[rel=manifest]').first().getAttribute('href')) === `/r/${ctok}/manifest.webmanifest`);
  const par = await mk(); await par.goto(BASE + panelLink, { waitUntil: 'networkidle' });
  check('el panel enlaza su manifiesto', (await par.locator('link[rel=manifest]').first().getAttribute('href')) === `/paje/${ptok}/manifest.webmanifest`);
  const fam = await mk(); await fam.goto(BASE + `/familia/${ftok}`, { waitUntil: 'networkidle' });
  check('la familia enlaza su manifiesto', (await fam.locator('link[rel=manifest]').first().getAttribute('href')) === `/familia/${ftok}/manifest.webmanifest`);
  check('el panel avisa de instalar en el móvil del peque con el icono del personaje', await par.getByText(/Añadir a pantalla de inicio/).first().isVisible().catch(() => false) || (await par.locator('body').innerText()).includes('Añadir a pantalla de inicio'));
  check('el niño NO ve nunca el aviso de instalar', (await kid.getByText('Instala').count()) === 0);

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
