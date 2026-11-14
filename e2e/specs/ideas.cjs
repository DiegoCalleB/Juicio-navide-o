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
  check('título principal con las 24 trastadas', await page.getByRole('heading', { level: 1 }).filter({ hasText: '24 mejores trastadas del elfo travieso' }).isVisible());
  check('hay 24 noches con idea y mensaje', (await page.locator('article[id^=noche-]').count()) === 24 && (await page.locator('blockquote').count()) === 24);
  check('los mensajes usan [nombre] y no quedan marcas sin rellenar', !/\{child\}|\{elf\}|\{o\}|\{el\}/.test(await page.locator('body').innerText()) && /\[nombre\]/.test(await page.locator('body').innerText()));
  check('no usa marcas registradas de terceros', !/elf on the shelf/i.test(await page.locator('body').innerText().then((t) => t.replace(/no está afiliada[^.]*\./i, ''))));
  check('hay un enlace a cada noche', (await page.locator('a[href^="/ideas-elfo/"]').count()) >= 24);

  // SEO
  check('título de la pestaña descriptivo', /24 mejores trastadas del elfo travieso/.test(await page.title()));
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
  check('noche 3: título con gracia', await page.getByRole('heading', { level: 1 }).filter({ hasText: /Spa de nubes/i }).isVisible());
  check('noche 3: paso a paso, ficha y por qué funciona', (await page.locator('#como + ol li').count()) >= 3 && await page.getByText(/min$/).first().isVisible() && await page.getByText(/jacuzzi de nubes/).isVisible());
  check('noche 3: mensaje del elfo', (await page.locator('blockquote').count()) === 1 && /nubes/i.test(await page.locator('blockquote').innerText()));
  check('noche 3: título de la pestaña y canonical propios', /^Noche 3 del elfo travieso/.test(await page.title()) && /\/ideas-elfo\/3$/.test((await meta(page, 'link[rel=canonical]')) ?? ''));
  check('noche 3: navegación a la anterior y la siguiente', await page.getByRole('link', { name: '← Noche 2' }).isVisible() && await page.getByRole('link', { name: 'Noche 4 →' }).isVisible());
  const ogNight = local(await meta(page, 'meta[property="og:image"]'));
  const imgNight = await fetch(ogNight);
  check('noche 3: imagen de vista previa propia (PNG)', imgNight.status === 200 && /image\/png/.test(imgNight.headers.get('content-type') ?? ''), `${imgNight.status}`);
  check('la imagen de la noche es distinta de la principal', ogNight !== ogMain);
  const wa3 = decodeURIComponent((await page.locator('a[href^="https://wa.me/"]').first().getAttribute('href')) ?? '');
  check('noche 3: WhatsApp comparte su propia dirección', /\/ideas-elfo\/3\?utm_source=whatsapp/.test(wa3), wa3.slice(0, 140));
  const pin = decodeURIComponent((await page.locator('a[href^="https://www.pinterest.com/pin/create/"]').first().getAttribute('href')) ?? '');
  check('noche 3: Pinterest con su imagen vertical, su enlace y etiquetas', /media=http.*\/ideas-elfo\/3\/imagen/.test(pin) && /url=http.*\/ideas-elfo\/3\?utm_source=pinterest/.test(pin) && /#TrastadasDelElfo/.test(pin), pin.slice(0, 160));
  const others = await Promise.all(['facebook.com/sharer', 'twitter.com/intent', 't.me/share'].map(async (h) => decodeURIComponent((await page.locator(`a[href*="${h}"]`).first().getAttribute('href')) ?? '')));
  check('noche 3: Facebook, X y Telegram con utm propio', /utm_source=facebook/.test(others[0]) && /utm_source=x/.test(others[1]) && /utm_source=telegram/.test(others[2]));
  const vert = await fetch(BASE + '/ideas-elfo/3/imagen');
  const vbuf = Buffer.from(await vert.arrayBuffer());
  check('imagen vertical para Pinterest/Instagram: PNG 1000x1500', vert.status === 200 && /image\/png/.test(vert.headers.get('content-type') ?? '') && vbuf.readUInt32BE(16) === 1000 && vbuf.readUInt32BE(20) === 1500);
  const dl = await fetch(BASE + '/ideas-elfo/3/imagen?descargar=1');
  check('"Guardar imagen" la descarga como archivo', /attachment; filename="trastada-elfo-3\.png"/.test(dl.headers.get('content-disposition') ?? '') && await page.getByRole('link', { name: 'Guardar imagen' }).isVisible());
  check('imagen de una trastada que no existe → 404', (await fetch(BASE + '/ideas-elfo/25/imagen')).status === 404);
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
  // Ilustraciones (opcionales): cada noche con su JPG en public/elfo/trastadas la enseña, con el aviso de IA
  const fs = require('fs');
  const arts = fs.existsSync('public/elfo/trastadas') ? fs.readdirSync('public/elfo/trastadas').filter((f) => /^\d+\.jpg$/.test(f)) : [];
  await page.goto(BASE + '/ideas-elfo', { waitUntil: 'networkidle' });
  check(`la lista enseña las ilustraciones que hay (${arts.length})`, (await page.locator('article[id^=noche-] img').count()) === arts.length);
  if (arts.length) {
    const d = arts[0].replace('.jpg', '');
    await page.goto(BASE + '/ideas-elfo/' + d, { waitUntil: 'networkidle' });
    check('la noche con ilustración la enseña con el aviso "creada con IA"', await page.locator('figure img').isVisible() && await page.getByText('Ilustración creada con IA').isVisible());
  }

  // Trastadas exprés (sin tiempo / se me olvidó)
  check('mapa del sitio: incluye la página "sin tiempo"', /\/ideas-elfo\/sin-tiempo</.test(sm));
  await page.goto(BASE + '/ideas-elfo', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: /Se te ha olvidado mover el elfo/ }).click();
  await page.waitForURL(/\/ideas-elfo\/sin-tiempo$/);
  check('sin tiempo: se llega desde la lista de las 24', true);
  check('sin tiempo: 15 trastadas exprés, cada una con su mensaje', (await page.locator('ol[aria-label="Trastadas exprés"] > li').count()) === 15 && (await page.locator('blockquote').count()) === 15);
  check('sin tiempo: título propio', /^15 trastadas del elfo para cuando no hay tiempo/.test(await page.title()));
  const pinQ = decodeURIComponent((await page.locator('a[href^="https://www.pinterest.com/pin/create/"]').first().getAttribute('href')) ?? '');
  check('sin tiempo: Pinterest con su chuleta vertical', /media=http.*\/ideas-elfo\/sin-tiempo\/imagen/.test(pinQ));
  const ch = await fetch(BASE + '/ideas-elfo/sin-tiempo/imagen');
  const cb = Buffer.from(await ch.arrayBuffer());
  check('sin tiempo: chuleta PNG 1000x1500', ch.status === 200 && cb.readUInt32BE(16) === 1000 && cb.readUInt32BE(20) === 1500);
  const ogQ = await meta(page, 'meta[property="og:image"]');
  check('sin tiempo: vista previa propia', /sin-tiempo\/opengraph-image/.test(ogQ ?? ''), ogQ);

  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
