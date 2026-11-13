// Página pública "24 trastadas del elfo": contenido, SEO, compartir, páginas por noche y enlace directo al formulario.
const { BASE, launch } = require('../_lib.cjs');
const results = [];
const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
const local = (u) => u.replace(/^https?:\/\/[^/]+/, BASE);

(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(() => { navigator.share = async (d) => { window.__shared = d; }; });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  const meta = (p, sel) => p.locator(sel).first().getAttribute(sel.includes('canonical') ? 'href' : 'content');

  // Página principal
  await page.goto(BASE + '/ideas-elfo', { waitUntil: 'networkidle', timeout: 120000 });
  check('título principal con las 24 trastadas', await page.getByRole('heading', { level: 1 }).filter({ hasText: '24 trastadas del elfo travieso' }).isVisible());
  check('hay 24 noches con idea y mensaje', (await page.locator('article[id^=noche-]').count()) === 24 && (await page.locator('blockquote').count()) === 24);
  check('los mensajes usan [nombre] y no quedan marcas sin rellenar', !/\{child\}|\{elf\}|\{o\}|\{el\}/.test(await page.locator('body').innerText()) && /\[nombre\]/.test(await page.locator('body').innerText()));
  check('no usa marcas registradas de terceros', !/elf on the shelf/i.test(await page.locator('body').innerText().then((t) => t.replace(/no está afiliada[^.]*\./i, ''))));
  check('hay un enlace a cada noche', (await page.locator('a[href^="/ideas-elfo/"]').count()) >= 24);

  // SEO
  check('título de la pestaña descriptivo', /24 trastadas del elfo travieso/.test(await page.title()));
  check('descripción', ((await meta(page, 'meta[name=description]')) ?? '').length > 80);
  check('canonical', /\/ideas-elfo$/.test((await meta(page, 'link[rel=canonical]')) ?? ''));
  check('Open Graph: título, descripción e imagen', !!(await meta(page, 'meta[property="og:title"]')) && !!(await meta(page, 'meta[property="og:description"]')) && !!(await meta(page, 'meta[property="og:image"]')));
  check('Twitter card grande', (await meta(page, 'meta[name="twitter:card"]')) === 'summary_large_image');
  const ogMain = local(await meta(page, 'meta[property="og:image"]'));
  const imgMain = await fetch(ogMain);
  check('la imagen de vista previa se genera (PNG)', imgMain.status === 200 && /image\/png/.test(imgMain.headers.get('content-type') ?? ''), `${imgMain.status} ${imgMain.headers.get('content-type')}`);
  const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').first().innerText());
  const types = ld['@graph'].map((g) => g['@type']);
  check('datos estructurados: lista de 24 y preguntas frecuentes', types.includes('ItemList') && types.includes('FAQPage') && ld['@graph'][0].numberOfItems === 24, types.join(','));

  // Compartir
  const wa = decodeURIComponent((await page.locator('a[href^="https://wa.me/"]').first().getAttribute('href')) ?? '');
  check('WhatsApp: lleva el enlace de la página con utm_source', /\/ideas-elfo\?utm_source=whatsapp&utm_medium=share/.test(wa), wa.slice(0, 120));
  await page.getByRole('button', { name: 'Copiar enlace' }).first().click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  check('copiar enlace: copia la dirección con utm_source=copy', /\/ideas-elfo\?utm_source=copy/.test(copied), copied);
  await page.getByRole('button', { name: 'Compartir', exact: true }).first().click();
  const shared = await page.evaluate(() => window.__shared);
  check('menú nativo del móvil: comparte título, texto y enlace', !!shared && /utm_source=native/.test(shared.url) && !!shared.text && !!shared.title, JSON.stringify(shared).slice(0, 120));
  await page.getByRole('button', { name: 'Copiar mensaje' }).first().click();
  check('copiar el mensaje del elfo', /\[nombre\]|Chispa|elfo|Polo Norte/.test(await page.evaluate(() => navigator.clipboard.readText())));

  // Una noche concreta
  await page.goto(BASE + '/ideas-elfo/3', { waitUntil: 'networkidle' });
  check('noche 3: título con su idea', await page.getByRole('heading', { level: 1 }).filter({ hasText: /nevera/i }).isVisible());
  check('noche 3: mensaje del elfo', (await page.locator('blockquote').count()) === 1 && /nevera|calorcito|Brrr/i.test(await page.locator('blockquote').innerText()));
  check('noche 3: título de la pestaña y canonical propios', /^Noche 3 del elfo travieso/.test(await page.title()) && /\/ideas-elfo\/3$/.test((await meta(page, 'link[rel=canonical]')) ?? ''));
  check('noche 3: navegación a la anterior y la siguiente', await page.getByRole('link', { name: '← Noche 2' }).isVisible() && await page.getByRole('link', { name: 'Noche 4 →' }).isVisible());
  const ogNight = local(await meta(page, 'meta[property="og:image"]'));
  const imgNight = await fetch(ogNight);
  check('noche 3: imagen de vista previa propia (PNG)', imgNight.status === 200 && /image\/png/.test(imgNight.headers.get('content-type') ?? ''), `${imgNight.status}`);
  check('la imagen de la noche es distinta de la principal', ogNight !== ogMain);
  const wa3 = decodeURIComponent((await page.locator('a[href^="https://wa.me/"]').first().getAttribute('href')) ?? '');
  check('noche 3: WhatsApp comparte su propia dirección', /\/ideas-elfo\/3\?utm_source=whatsapp/.test(wa3), wa3.slice(0, 140));
  check('la primera noche no tiene "anterior" y la última no tiene "siguiente"', await (async () => {
    await page.goto(BASE + '/ideas-elfo/1', { waitUntil: 'networkidle' });
    const a = (await page.getByRole('link', { name: /← Noche/ }).count()) === 0;
    await page.goto(BASE + '/ideas-elfo/24', { waitUntil: 'networkidle' });
    return a && (await page.getByRole('link', { name: /Noche \d+ →/ }).count()) === 0;
  })());
  for (const bad of ['0', '25', 'abc']) {
    await page.goto(BASE + '/ideas-elfo/' + bad, { waitUntil: 'networkidle' });
    check(`/ideas-elfo/${bad} no existe`, await page.getByText('Este enlace no existe').isVisible());
  }

  // Enlace directo al formulario con el elfo ya elegido
  await page.goto(BASE + '/ideas-elfo/3', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Probar gratis' }).click();
  await page.getByRole('button', { name: 'Cambiar de personaje' }).waitFor({ timeout: 15000 });
  check('"Probar gratis" lleva al formulario con el elfo ya elegido', await page.getByText('Vuestro elfo travieso').isVisible() && await page.locator('input[name=character]:checked').count() === 0 && await page.getByText('Elfo travieso', { exact: true }).first().isVisible());
  await page.goto(BASE + '/?personaje=papa_noel', { waitUntil: 'networkidle' });
  check('/?personaje=papa_noel deja elegido a Papá Noel', await page.getByRole('button', { name: 'Cambiar de personaje' }).isVisible());
  await page.goto(BASE + '/?personaje=inventado', { waitUntil: 'networkidle' });
  check('un personaje inventado se ignora (no hay nada elegido)', (await page.getByRole('button', { name: 'Cambiar de personaje' }).count()) === 0);

  // Portada y mapa del sitio
  check('la portada enlaza a las trastadas', await page.getByRole('link', { name: 'Trastadas del elfo' }).isVisible());
  const sm = await (await fetch(BASE + '/sitemap.xml')).text();
  check('mapa del sitio: página principal y las 24 noches', /\/ideas-elfo</.test(sm) && (sm.match(/\/ideas-elfo\/\d+</g) ?? []).length === 24);
  const robots = await (await fetch(BASE + '/robots.txt')).text();
  check('robots: permite /ideas-elfo y sigue bloqueando las salas', /Allow: \/ideas-elfo/.test(robots) && /Disallow: \/paje\//.test(robots));

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
