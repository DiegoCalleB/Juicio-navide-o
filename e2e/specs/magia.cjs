// REGLA DE ORO (AGENTS.md): nada de lo que pueda ver un peque delata la magia, y la zona de mayores
// solo se abre pasando la puerta. Esta prueba navega como un niño (sin sesión de adulto).
const { OUT: S, BASE, launch, ensureChar, childLinkOf } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };

// Frases que delatan (ampliar si aparecen otras). Se buscan en el texto visible y en los metadatos.
const DELATAN = [
  /contest\w* en secreto/i, /no somos pap/i, /como si fuer[ae]/i, /\bt[úu] (escribes|contestas|respondes)\b/i,
  /los padres (escriben|contestan|hacen|mueven)/i, /escrito por ti/i, /zona secreta/i, /panel de los padres/i,
  /\bpaje\b/i, /inteligencia artificial/i, /\bIA\b/, /voz sintetizada/i, /se te ha olvidado/i, /mover(lo|le) /i,
  /prueba gratis/i, /pase de navidad/i, /\bprecio/i, /\bsin registrarte\b/i, /\bapp\b/i, /cómo se prepara/i,
];
const delata = (txt) => DELATAN.filter((r) => r.test(txt)).map(String);

(async () => {
  // Una sala de verdad, creada por un adulto (para revisar luego lo que ve el niño)
  const adult = await launch();
  const a = await (await adult.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await a.goto(BASE + '/crear', { waitUntil: 'networkidle', timeout: 120000 });
  await a.fill('#child', 'Lucía'); await a.locator('form').getByRole('checkbox').check();
  await ensureChar(a); await a.getByRole('button', { name: /Crear la sala/ }).click();
  await a.waitForSelector('text=La sala está lista', { timeout: 30000 });
  const childLink = (await childLinkOf(a)).replace(/^https?:\/\/[^/]+/, '');
  const panelLink = (await a.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href')).replace(/^https?:\/\/[^/]+/, '');
  const familyLink = await a.locator('[data-family-link]').first().getAttribute('data-family-link').catch(() => null);
  await adult.close();

  // ── Como un niño: sin sesión de adulto
  const b = await launch([], { adult: false });
  const kid = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; kid.on('pageerror', (e) => errs.push(e.message));
  const meta = async () => kid.evaluate(() => [document.title, ...[...document.querySelectorAll('meta[name=description],meta[property^="og:"],meta[name^="twitter:"]')].map((m) => m.getAttribute('content') || '')].join(' | '));

  for (const [name, path] of [['portada', '/'], ['diario de Chispa', '/diario-de-chispa'], ['puerta de mayores', '/mayores']]) {
    await kid.goto(BASE + path, { waitUntil: 'networkidle', timeout: 120000 });
    const txt = (await kid.locator('body').innerText()) + ' | ' + (await meta());
    const bad = delata(txt);
    check(`${name}: ninguna frase que delate la magia`, bad.length === 0, bad.join(', '));
  }
  await kid.goto(BASE + '/', { waitUntil: 'networkidle' });
  await kid.screenshot({ path: S + '/mg1-portada.png' });
  check('portada: el botón para adultos dice «Para mamás y papás»', await kid.getByRole('link', { name: 'Para mamás y papás' }).isVisible());
  check('portada: ni precios ni «Mis salas»', (await kid.getByText(/€|Ya tengo salas|Tus salas/).count()) === 0);

  // La sala del niño, su manifiesto, robots, sitemap y manifiesto general
  await kid.goto(BASE + childLink, { waitUntil: 'networkidle' });
  const room = (await kid.locator('body').innerText()) + ' | ' + (await meta());
  check('sala del niño: ninguna frase que delate la magia', delata(room).length === 0, delata(room).join(', '));
  for (const [name, path] of [['manifiesto general', '/manifest.webmanifest'], ['manifiesto de la sala', childLink + '/manifest.webmanifest'], ['robots.txt', '/robots.txt'], ['sitemap', '/sitemap.xml']]) {
    const t = await (await fetch(BASE + path)).text();
    const bad = delata(t.replace(/"categories":\[[^\]]*\]/, ''));
    check(`${name}: ninguna frase que delate la magia`, bad.length === 0, bad.join(', '));
  }
  const sm = await (await fetch(BASE + '/sitemap.xml')).text();
  check('sitemap: solo el mundo mágico (sin ideas, crear, precios…)', !/ideas-elfo|crear|precios|mayores|privacidad|terminos/.test(sm));

  // ── La zona de mayores no se abre sin la puerta
  const adultPaths = ['/crear', '/precios', '/ideas-elfo', '/ideas-elfo/10', '/ideas-elfo/sin-tiempo', '/privacidad', '/terminos', panelLink, ...(familyLink ? [familyLink.replace(/^https?:\/\/[^/]+/, '')] : [])];
  let allGated = true; const leaks = [];
  for (const p of adultPaths) {
    await kid.goto(BASE + p, { waitUntil: 'domcontentloaded' });
    const ok = /\/mayores\?next=/.test(kid.url()) && (await kid.getByRole('heading', { name: 'Zona de mayores' }).isVisible());
    if (!ok) { allGated = false; leaks.push(p); }
  }
  check('toda la zona de mayores (crear, precios, ideas, legal, paneles) lleva a la puerta', allGated, leaks.join(', '));
  const ogIdeas = await fetch(BASE + '/ideas-elfo/10/imagen', { redirect: 'manual' });
  check('las imágenes de instrucciones tampoco se sirven sin puerta', ogIdeas.status >= 300 && ogIdeas.status < 400, String(ogIdeas.status));

  // ── La puerta
  await kid.goto(BASE + '/crear', { waitUntil: 'networkidle' });
  await kid.screenshot({ path: S + '/mg2-puerta.png' });
  const q = await kid.getByTestId('gate-question').innerText();
  check('la puerta pide una cuenta de cabeza', /^\d+ [×−+] \d+ = \?$/.test(q.trim()), q);
  for (let i = 0; i < 3; i++) {
    await kid.fill('#gate-answer', '1');
    await kid.getByRole('button', { name: 'Entrar' }).click();
    await kid.waitForTimeout(400);
  }
  check('3 fallos bloquean la puerta', await kid.getByText(/Demasiados intentos/).isVisible());
  check('bloqueada, no se puede volver a intentar', (await kid.locator('#gate-answer').count()) === 0);

  // Un adulto de verdad (otro navegador): contesta y entra
  const b2 = await launch([], { adult: false });
  const p2 = await (await b2.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (adulto) E2E' })).newPage();
  await p2.goto(BASE + '/crear', { waitUntil: 'networkidle' });
  const solve = async (page) => {
    const [x, op, y] = (await page.getByTestId('gate-question').innerText()).replace('= ?', '').trim().split(' ');
    return String(op === '×' ? Number(x) * Number(y) : op === '−' ? Number(x) - Number(y) : Number(x) + Number(y));
  };
  // Respuesta con el token caducado o manipulado: no entra
  const tampered = await p2.evaluate(async () => (await fetch('/api/mayores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'x.1.y', answer: '42' }) })).status);
  check('un token falso no abre la puerta', tampered === 400, String(tampered));
  await p2.fill('#gate-answer', await solve(p2));
  await Promise.all([p2.waitForURL(/\/crear$/, { timeout: 15000 }), p2.getByRole('button', { name: 'Entrar' }).click()]);
  check('con la respuesta correcta, entra donde iba (/crear)', await p2.locator('#child').isVisible());
  await p2.goto(BASE + '/mayores', { waitUntil: 'networkidle' });
  check('dentro, la zona de mayores muestra su menú', await p2.getByRole('link', { name: /Crear una sala/ }).isVisible() && await p2.getByRole('link', { name: 'Privacidad' }).isVisible());
  await p2.screenshot({ path: S + '/mg3-zona.png' });
  await Promise.all([p2.waitForURL(BASE + '/', { timeout: 15000 }), p2.getByRole('button', { name: 'Cerrar la zona de mayores' }).click()]);
  await p2.goto(BASE + '/precios', { waitUntil: 'domcontentloaded' });
  check('«Cerrar la zona de mayores» la cierra al momento', /\/mayores\?next=/.test(p2.url()));

  // No redirige a otra web
  const p3 = await (await b2.newContext({ userAgent: 'Mozilla/5.0 (otro adulto) E2E' })).newPage();
  await p3.goto(BASE + '/mayores?next=//evil.example.com', { waitUntil: 'networkidle' });
  await p3.fill('#gate-answer', await solve(p3));
  await p3.getByRole('button', { name: 'Entrar' }).click();
  await p3.waitForURL(/localhost/, { timeout: 15000 }).catch(() => {});
  await p3.waitForTimeout(800);
  check('la puerta nunca manda a otra web', new URL(p3.url()).host === new URL(BASE).host, p3.url());

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`RESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close(); await b2.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
