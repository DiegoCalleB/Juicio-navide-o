// Diseño para ordenadores: sin desbordes horizontales en ningún tamaño y portada en dos columnas.
const { BASE, launch, ensureChar, childLinkOf, familyLinkOf, openChild } = require('../_lib.cjs');
const results = [];
const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };

(async () => {
  const b = await launch();
  const mobile = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await mobile.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await p.fill('#child', 'Valentina'); await p.locator('form').getByRole('checkbox').check();
  await ensureChar(p); await p.getByRole('button', { name: /Crear la sala/ }).click();
  await p.waitForSelector('text=La sala está lista', { timeout: 30000 });
  const panel = (await p.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href')).replace(/^https?:\/\/[^/]+/, '');
  const kid = (await childLinkOf(p)).replace(/^https?:\/\/[^/]+/, ''), fam = (await familyLinkOf(p)).replace(/^https?:\/\/[^/]+/, '');
  const storage = await mobile.storageState();

  const pages = [['portada', '/'], ['panel de padres', panel], ['familia', fam], ['sala del peque', kid], ['trastadas del elfo', '/ideas-elfo'], ['privacidad', '/privacidad'], ['términos', '/terminos']];
  for (const [w, h] of [[1440, 900], [1024, 768], [768, 1024], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, storageState: storage });
    for (const [name, path] of pages) {
      const pg = await ctx.newPage();
      await pg.goto(BASE + path, { waitUntil: 'networkidle' });
      if (name === 'sala del peque') await openChild(pg, BASE + path);
      await pg.waitForTimeout(600);
      // El contenido va dentro de contenedores fijos con scroll propio: se mide el ancho del contenido, no de la ventana.
      const over = await pg.evaluate(() => {
        const vw = window.innerWidth;
        const roots = [document.documentElement, document.body, ...[...document.querySelectorAll('body *')].filter((el) => getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().width >= vw - 2)];
        return Math.round(Math.max(...roots.map((el) => el.scrollWidth - el.clientWidth)));
      });
      check(`${name} a ${w}px: nada se sale de la pantalla`, over <= 1, over > 1 ? `${over}px de más` : '');
      await pg.close();
    }
    await ctx.close();
  }

  // Portada en escritorio: texto a la izquierda y demo a la derecha
  const d = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await d.goto(BASE + '/', { waitUntil: 'networkidle' });
  const h1 = await d.locator('h1').boundingBox(), demo = await d.locator('#demo-title').boundingBox();
  check('portada de escritorio: el título a la izquierda y la demo a la derecha', h1 && demo && demo.x > h1.x + h1.width - 40, `h1 x=${Math.round(h1?.x)} demo x=${Math.round(demo?.x)}`);
  const cta = await d.getByRole('link', { name: 'Crear la sala de mi peque' }).boundingBox();
  check('la portada de escritorio enseña el botón principal sin hacer scroll', cta && cta.y + cta.height < 900);
  // En móvil sigue en una columna
  const m = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await m.goto(BASE + '/', { waitUntil: 'networkidle' });
  const h1m = await m.locator('h1').boundingBox(), demom = await m.locator('#demo-title').boundingBox();
  check('portada de móvil: una sola columna (la demo debajo del título)', demom.y > h1m.y + h1m.height);
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
