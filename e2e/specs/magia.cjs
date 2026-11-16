// REGLA DE ORO (AGENTS.md): nada de lo que pueda ver un peque delata la magia, y la zona de mayores
// solo se abre pasando la puerta. Esta prueba navega como un niño (sin sesión de adulto).
const { OUT: S, BASE, launch, ensureChar, childLinkOf } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };

// Frases que delatan (ampliar si aparecen otras). Se buscan en el texto visible y en los metadatos.
const DELATAN = [
  /contest\w* en secreto/i, /no somos pap/i, /como si fuer[ae]/i, /\bt[úu] (escribes|contestas|respondes)\b/i,
  /los padres (escriben|contestan|hacen|mueven)/i, /escrito por ti/i, /zona secreta/i, /panel de los padres/i,
  /\bpaje\b/i, /inteligencia artificial/i, /\bIA\b/, /voz sintetizada/i, /se te ha olvidado/i, /mover(lo|le) /i,
  /prueba gratis/i, /para mam[aá]s y pap[aá]s/i, /zona de mayores/i, /solo (para )?adultos/i, /pase de navidad/i, /\bprecio/i, /\bsin registrarte\b/i, /\bapp\b/i, /cómo se prepara/i,
];
// Una IP inventada por ejecución: el bloqueo por red no se acumula entre ejecuciones ni afecta a otras pruebas.
const r255 = () => 1 + Math.floor(Math.random() * 250);
const IP = `10.${r255()}.${r255()}.${r255()}`;
const HDR = { 'x-forwarded-for': IP };
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
  const kid = await (await b.newContext({ viewport: { width: 390, height: 844 }, extraHTTPHeaders: HDR })).newPage();
  const errs = []; kid.on('pageerror', (e) => errs.push(e.message));
  const meta = async () => kid.evaluate(() => [document.title, ...[...document.querySelectorAll('meta[name=description],meta[property^="og:"],meta[name^="twitter:"]')].map((m) => m.getAttribute('content') || '')].join(' | '));

  for (const [name, path] of [['portada', '/'], ['diario de Chispa', '/diario-de-chispa'], ['Polo Norte de Chispa', '/polo-norte'], ['puerta de mayores', '/mayores']]) {
    await kid.goto(BASE + path, { waitUntil: 'networkidle', timeout: 120000 });
    const txt = (await kid.locator('body').innerText()) + ' | ' + (await meta());
    const bad = delata(txt);
    check(`${name}: ninguna frase que delate la magia`, bad.length === 0, bad.join(', '));
  }
  await kid.goto(BASE + '/', { waitUntil: 'networkidle' });
  await kid.screenshot({ path: S + '/mg1-portada.png' });
  check('portada: lo más vistoso es el diario de Chispa', await kid.getByRole('link', { name: 'Lee el diario de Chispa' }).isVisible());
  const parentLink = kid.getByRole('link', { name: 'Cuenta y condiciones' });
  const sizeOf = async (l) => await l.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  check('portada: el acceso de los mayores es un enlace pequeño y discreto (nada llamativo)', (await parentLink.count()) === 1 && (await sizeOf(parentLink)) <= 12 && (await kid.getByRole('link', { name: /mam[aá]s|pap[aá]s|mayores|adultos/i }).count()) === 0);
  check('portada: ni precios ni «Mis salas»', (await kid.getByText(/€|Ya tengo salas|Tus salas/).count()) === 0);

  // El rincón del Polo Norte: contenido para curiosos, sin formularios ni enlaces de mayores
  await kid.goto(BASE + '/', { waitUntil: 'networkidle' });
  check('portada: enlaces a chistes, adivinanzas, renos y mapa', (await kid.locator('a[href^="/polo-norte#"]').count()) === 4);
  await Promise.all([kid.waitForURL(/\/polo-norte#chistes$/), kid.getByRole('link', { name: 'Chistes del elfo' }).click()]);
  const q1 = await kid.getByTestId('chiste-pregunta').innerText();
  await kid.getByRole('button', { name: '¿Y qué dice?' }).click();
  check('chiste: se ve la respuesta al pulsar', (await kid.getByTestId('chiste-respuesta').innerText()).length > 3);
  await kid.getByRole('button', { name: 'Otro chiste' }).click();
  check('«Otro chiste» enseña un chiste distinto', (await kid.getByTestId('chiste-pregunta').innerText()) !== q1);
  const det = kid.locator('#adivinanzas details').first();
  await det.locator('summary').click();
  check('adivinanzas: la respuesta aparece al pulsar', await det.locator('p').isVisible());
  check('hay 8 renos y 6 sitios en el mapa', (await kid.locator('#renos li').count()) === 8 && (await kid.locator('#mapa details').count()) === 6);
  check('el rincón no tiene formularios ni enlaces de mayores', (await kid.locator('form, input, textarea, a[href*="mayores"], a[href*="crear"]').count()) === 0);

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
    const ok = /\/mayores\?next=/.test(kid.url()) && (await kid.getByRole('heading', { name: 'Acceso a la cuenta' }).isVisible());
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
    await Promise.all([kid.waitForResponse((r) => r.url().endsWith('/api/mayores')), kid.getByRole('button', { name: 'Entrar' }).click()]);
    await kid.waitForTimeout(300);
  }
  check('3 fallos bloquean la puerta', await kid.getByText(/Demasiados intentos/).isVisible());
  check('bloqueada, no se puede volver a intentar', (await kid.locator('#gate-answer').count()) === 0);

  // Un adulto de verdad (otro navegador): contesta y entra
  const b2 = await launch([], { adult: false });
  const p2 = await (await b2.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (adulto) E2E', extraHTTPHeaders: HDR })).newPage();
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
  const p3 = await (await b2.newContext({ userAgent: 'Mozilla/5.0 (otro adulto) E2E', extraHTTPHeaders: HDR })).newPage();
  await p3.goto(BASE + '/mayores?next=//evil.example.com', { waitUntil: 'networkidle' });
  await p3.fill('#gate-answer', await solve(p3));
  await p3.getByRole('button', { name: 'Entrar' }).click();
  await p3.waitForURL(/localhost/, { timeout: 15000 }).catch(() => {});
  await p3.waitForTimeout(800);
  check('la puerta nunca manda a otra web', new URL(p3.url()).host === new URL(BASE).host, p3.url());

  // Bloqueo por red: cambiar de navegador no sirve para seguir probando (9 fallos desde la misma conexión)
  const solveApi = async (api) => {
    const q = (await (await api.get(BASE + '/api/mayores/pregunta')).json()).data;
    const [x, op, y] = q.question.split(' ');
    return { token: q.token, right: String(op === '×' ? +x * +y : op === '−' ? +x - +y : +x + +y) };
  };
  const apiOf = async (ua) => (await b2.newContext({ userAgent: ua, extraHTTPHeaders: HDR })).request;
  let last = null;
  for (let i = 0; i < 12; i++) { const n1 = await apiOf(`Mozilla/5.0 (cambio ${i}) E2E`); const { token } = await solveApi(n1); last = await n1.post(BASE + '/api/mayores', { data: { token, answer: '1' } }); if (last.status() === 429) break; }
  check('los fallos de una misma conexión acaban bloqueándola (también al cambiar de navegador)', last.status() === 429);
  const n2 = await apiOf('Mozilla/5.0 (cambio 2) E2E');
  const { token: t2, right } = await solveApi(n2);
  const blocked = await n2.post(BASE + '/api/mayores', { data: { token: t2, answer: right } });
  const bj = await blocked.json();
  check('con la red bloqueada, ni la respuesta correcta abre la puerta (y avisa del tiempo)', blocked.status() === 429 && /15 minutos/.test(bj.error?.message ?? ''), bj.error?.message);
  // Otra conexión distinta no se ve afectada
  const other = (await b2.newContext({ userAgent: 'Mozilla/5.0 (otra casa) E2E', extraHTTPHeaders: { 'x-forwarded-for': `10.${r255()}.${r255()}.${r255()}` } })).request;
  const o = await solveApi(other);
  check('otra conexión distinta entra con normalidad', (await other.post(BASE + '/api/mayores', { data: { token: o.token, answer: o.right } })).status() === 200);

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`RESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close(); await b2.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
