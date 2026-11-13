const { OUT: S, FIX, BASE, launch, openChild, ensureChar } = require('../_lib.cjs');
const { childLinkOf, familyLinkOf } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  // ── Metadatos, PWA, SEO y cabeceras (sin navegador)
  const man = await (await fetch(BASE + '/manifest.webmanifest')).json();
  check('manifest válido e instalable', man.display === 'standalone' && man.start_url === '/' && man.icons.length >= 3 && man.lang === 'es', man.name);
  for (const ic of man.icons) { const r = await fetch(BASE + ic.src); check('icono accesible ' + ic.src, r.status === 200 && (r.headers.get('content-type') || '').includes('image/png')); }
  check('apple-touch-icon accesible', (await fetch(BASE + '/apple-icon.png')).status === 200);
  const robots = await (await fetch(BASE + '/robots.txt')).text();
  check('robots.txt bloquea /r/, /paje/ y /api/', /Disallow: \/r\//.test(robots) && /Disallow: \/paje\//.test(robots) && /Disallow: \/api\//.test(robots) && /Sitemap:/.test(robots));
  const sm = await (await fetch(BASE + '/sitemap.xml')).text();
  check('sitemap incluye portada, privacidad y términos', /privacidad/.test(sm) && /terminos/.test(sm) && !/\/paje\//.test(sm));
  const home = await (await fetch(BASE + '/')).text();
  check('portada: viewport-fit=cover, theme-color y apple-mobile-web-app', /viewport-fit=cover/.test(home) && /theme-color/.test(home) && /apple-mobile-web-app-capable|mobile-web-app-capable/.test(home));
  const tok = 'A'.repeat(43);
  for (const path of ['/r/' + tok, '/paje/' + tok]) {
    const r = await fetch(BASE + path);
    check(`ruta secreta ${path.slice(0, 7)}…: Referrer-Policy no-referrer + no-store`, r.headers.get('referrer-policy') === 'no-referrer' && /no-store/.test(r.headers.get('cache-control') || ''), `${r.headers.get('referrer-policy')} | ${r.headers.get('cache-control')}`);
    check(`ruta secreta ${path.slice(0, 7)}…: noindex`, /noindex/.test(await r.text()));
  }

  // ── Pantallas
  const b = await launch(['--no-sandbox']);
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text().slice(0, 140)); });
  await page.goto(BASE + '/r/' + tok, { waitUntil: 'networkidle', timeout: 60000 });
  check('enlace del niño inválido: pantalla amable', await page.getByRole('heading', { name: 'Este enlace no funciona' }).waitFor({ timeout: 40000 }).then(() => true, () => false));
  await page.screenshot({ path: S + '/u1-child-notfound.png' });
  await page.goto(BASE + '/paje/' + tok, { waitUntil: 'networkidle' });
  check('panel inválido: pantalla amable con acción', await page.getByRole('heading', { name: /no existe o ha caducado/ }).waitFor({ timeout: 40000 }).then(() => true, () => false) && await page.getByRole('link', { name: 'Crear una sala nueva' }).isVisible());
  await page.goto(BASE + '/privacidad', { waitUntil: 'networkidle' });
  check('privacidad: menciona audios, ElevenLabs y el contacto configurado', await page.getByText(/ElevenLabs/).first().isVisible() && await page.getByRole('link', { name: 'hola@ejemplo.com' }).isVisible());
  await page.goto(BASE + '/terminos', { waitUntil: 'networkidle' });
  check('términos de uso disponibles', await page.getByRole('heading', { name: 'Términos de uso' }).isVisible());
  await page.screenshot({ path: S + '/u2-terms.png' });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  check('portada: pie con Privacidad y Términos', await page.getByRole('link', { name: 'Privacidad' }).isVisible() && await page.getByRole('link', { name: 'Términos de uso' }).isVisible());
  // foco visible por teclado
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => { const el = document.activeElement; const cs = getComputedStyle(el); return cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor; });
  check('foco visible con teclado', /solid 3px/.test(outline), outline);

  // ── Reconexión: cortar la red al niño y ver el aviso; al volver, desaparece
  await page.fill('#child', 'Lucía'); await page.getByRole('checkbox').check();
  await ensureChar(page); await page.getByRole('button', { name: /Crear la sala/ }).click();
  await page.waitForSelector('text=La sala está lista');
  const childLink = (await childLinkOf(page));
  const child = await ctx.newPage();
  await openChild(child, childLink, {});
  await child.waitForTimeout(1500);
  check('conectado: sin aviso de reconexión', (await child.getByText('Se ha cortado la línea mágica').count()) === 0);
  // Bloqueamos el canal SSE y las consultas para simular pérdida de conexión
  await child.route('**/api/rooms/**', r => r.abort());
  await child.evaluate(() => { /* fuerza error del EventSource */ });
  await child.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await child.waitForTimeout(8500);
  const showed = await child.getByText('Se ha cortado la línea mágica').isVisible().catch(() => false);
  check('sin conexión: aparece "Se ha cortado la línea mágica…" pasados unos segundos', showed);
  await child.screenshot({ path: S + '/u3-offline.png' });
  await child.unroute('**/api/rooms/**');
  await child.waitForSelector('text=Se ha cortado la línea mágica', { state: 'detached', timeout: 15000 }).then(() => check('al volver la conexión, el aviso desaparece solo', true)).catch(() => check('al volver la conexión, el aviso desaparece solo', false));
  check('sin errores de página ni consola', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`RESUMEN: ${results.filter(Boolean).length}/${results.length} OK`);
  await b.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch(e => { console.error('CRASH', e.message); process.exit(2); });
