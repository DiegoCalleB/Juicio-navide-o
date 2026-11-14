const { OUT: S, FIX, BASE, launch, ensureFixtures, ensureChar } = require('../_lib.cjs');
const { childLinkOf, familyLinkOf } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
const pad = (n) => String(n).padStart(2, '0');
(async () => {
  await ensureFixtures();
  const b = await launch();
  const mk = () => b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const parent = await (await mk()).newPage(), child = await (await mk()).newPage();
  const errs = []; for (const [n, p] of [['parent', parent], ['child', child]]) p.on('pageerror', (e) => errs.push(n + ':' + e.message));

  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  check('el selector ofrece al elfo travieso', (await parent.getByRole('radio', { name: /Elfo Chispa/ }).count()) === 1);
  await parent.fill('#child', 'Lucía');
  check('sin elegir al elfo, no se piden nombre ni género', (await parent.locator('#elf-alias').count()) === 0);
  await parent.locator('label', { hasText: 'Elfo Chispa' }).click();
  check('al elegirlo, cada familia puede ponerle nombre y elegir chico o chica', await parent.locator('#elf-alias').isVisible() && await parent.getByRole('radio', { name: 'Es una elfa' }).isVisible());
  await parent.fill('#elf-alias', 'Chispita');
  await parent.getByRole('radio', { name: 'Es una elfa' }).click();
  await parent.getByRole('checkbox').check();
  await parent.screenshot({ path: S + '/du1-selector.png' });
  await ensureChar(parent); await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala está lista', { timeout: 30000 });
  check('la sala usa el nombre elegido', await parent.getByText(/Chispita/).first().isVisible());
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await childLinkOf(parent));
  const parentToken = pajeHref.split('/paje/')[1], childToken = childLink.split('/r/')[1];
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  check('panel: "Contestas como Elfa Chispita a Lucía"', await parent.getByText('Contestas como Elfa Chispita a Lucía').isVisible());
  const tabs = (await parent.getByRole('tab').allInnerTexts()).join('|');
  check('plantillas del elfo', tabs === 'Primer saludo|Travesuras|Me has pillado|Charla', tabs);
  await parent.getByRole('tab', { name: 'Primer saludo' }).click();
  const chip = await parent.getByRole('button', { name: /Me has encontrado/ }).first().innerText();
  check('las plantillas hablan en femenino y con su nombre', /Soy Chispita, una elfa muy traviesa/.test(chip), chip.slice(0, 90));
  check('no se cuelan marcas sin rellenar', !/\{(elf|o|el|un|del|Elfo)\}/.test(await parent.locator('body').innerText()));

  await child.goto(childLink.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: 'domcontentloaded' });
  await child.getByRole('button', { name: 'Abrir mensaje de la Elfa Chispita' }).waitFor({ timeout: 20000 });
  check('intro con artículo y nombre: "de la Elfa Chispita"', await child.getByText(/tienes un mensaje de la Elfa Chispita/).isVisible());
  await child.getByRole('button', { name: 'Abrir mensaje de la Elfa Chispita' }).click();
  await child.waitForSelector('#royal-draft');
  check('sala vacía: "Soy Chispita, la elfa traviesa"', await child.getByText('Soy Chispita, la elfa traviesa').isVisible());
  await child.screenshot({ path: S + '/du2-child.png' });
  await child.fill('#royal-draft', '¡Te encontré detrás del sofá!'); await child.keyboard.press('Enter');
  await child.waitForSelector('text=He recibido tu mensaje', { timeout: 8000 }).then(() => check('acuse en primera persona y en femenino ("escondida")', true)).catch(() => check('acuse del elfo', false));
  check('el acuse concuerda con el género', (await child.locator('body').innerText()).includes('escondida'));
  check('el niño no ve ayudantes, otros personajes ni marcas sin rellenar', (await child.locator('body').innerText()).match(/Quesito|Cascabel|Zafiro|ayudante|Ratoncito|Melchor|\{(elf|o|el|un|del|Elfo)\}/i) === null);

  // Ideas de travesuras: los padres eligen idea, escriben ellos y programan
  await parent.getByRole('button', { name: /Ideas de travesuras/ }).click();
  const ideas = parent.getByRole('dialog', { name: 'Ideas de travesuras' });
  check('hay 24 ideas de travesuras', (await ideas.getByRole('button', { name: /Usar esta idea/ }).count()) === 24);
  check('la app no escribe los mensajes por los padres (solo propone la escena)', await ideas.getByText('Tú decides qué escribir').isVisible());
  await ideas.getByRole('button', { name: 'Usar esta idea' }).nth(4).click();
  check('al elegir una idea, aparece su tarjeta en el panel', await parent.getByText('Idea de travesura · día 5').isVisible());
  await parent.getByRole('button', { name: 'Ver una sugerencia de mensaje' }).click();
  const sug = await parent.inputValue('#reply');
  check('la sugerencia es opcional, editable y con el nombre del niño', sug.includes('Lucía') && !/\{/.test(sug), sug.slice(0, 70));
  // Sin tiempo: trastadas exprés que rellenan el mensaje al momento (en femenino y con su nombre)
  await parent.getByRole('button', { name: '⚡ Sin tiempo' }).click();
  const quick = parent.getByRole('dialog', { name: 'Ideas de travesuras' });
  check('pestaña "Sin tiempo" con 15 trastadas exprés', (await quick.getByRole('button', { name: 'Usar su mensaje' }).count()) === 15 && (await quick.getByRole('tab', { name: '⚡ Sin tiempo' }).getAttribute('aria-selected')) === 'true');
  await quick.getByRole('button', { name: 'Usar su mensaje' }).first().click();
  const q1 = await parent.inputValue('#reply');
  check('la trastada exprés rellena el mensaje (femenino, con el nombre)', /cansada/.test(q1) && /dormida/.test(q1) && q1.includes('Lucía') && !/\{/.test(q1), q1.slice(0, 80));
  await parent.fill('#reply', 'Hoy Chispita se ha escondido en el frutero. ¡A ver si la encuentras!');
  await parent.screenshot({ path: S + '/du3-idea.png' });

  // Programar el mensaje (con foto) para mañana a las 8:00
  await parent.getByTestId('photo-input').setInputFiles(FIX + '/foto-padres.png');
  await parent.getByText('Foto lista').waitFor({ timeout: 10000 });
  await parent.getByRole('radio', { name: 'Otro día' }).click();
  await parent.getByRole('button', { name: 'Mañana a las 8:00' }).click();
  check('el selector de fecha acepta "Mañana a las 8:00"', (await parent.inputValue('#when-custom')).endsWith('T08:00'));
  await parent.getByRole('button', { name: /Enviar foto como Chispita/ }).click();
  await parent.waitForSelector('text=lo enviará', { timeout: 10000 }).then(() => check('la foto con su mensaje se programa para mañana', true)).catch(() => check('la foto con su mensaje se programa para mañana', false));
  const list = await (await fetch(`${BASE}/api/rooms/${parentToken}/messages`)).json();
  const pend = (list.data.messages || []).filter((m) => m.pending);
  check('queda 1 mensaje pendiente (la foto con pie)', pend.length === 1 && pend[0].kind === 'photo' && /frutero/.test(pend[0].text || ''), JSON.stringify(pend.map((m) => m.kind)));
  const when = new Date(pend[0]?.at || 0);
  check('programado para mañana a las 8:00', when.getHours() === 8 && when.getTime() > Date.now() + 3600_000, when.toString().slice(0, 24));
  const childList = await (await fetch(`${BASE}/api/rooms/${childToken}/messages`)).text();
  check('el niño no lo ve todavía', !childList.includes('frutero'));

  // texto programado para otro día
  await parent.fill('#reply', 'Mensaje de texto para mañana');
  check('tras programar, el selector vuelve a "Ahora"', (await parent.getByRole('radio', { name: 'Ahora' }).getAttribute('aria-checked')) === 'true');
  await parent.getByRole('radio', { name: 'Otro día' }).click();
  await parent.getByRole('button', { name: 'Mañana a las 8:00' }).click();
  await parent.getByRole('button', { name: /Enviar como Chispita/ }).click();
  await parent.waitForSelector('text=lo enviará', { timeout: 10000 }).catch(() => {});
  const list2 = await (await fetch(`${BASE}/api/rooms/${parentToken}/messages`)).json();
  check('también se programa un texto', (list2.data.messages || []).filter((m) => m.pending).length === 2);

  // validaciones de la API
  const form = new FormData(); form.append('image', new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])], { type: 'image/jpeg' }), 'x.jpg'); form.append('scheduledAt', new Date(Date.now() - 600_000).toISOString());
  check('foto con fecha pasada → 400', (await fetch(`${BASE}/api/rooms/${parentToken}/photo`, { method: 'POST', body: form })).status === 400);

  // Cambiar el género y el nombre desde la sala
  await parent.getByRole('button', { name: /Preparativos/ }).click().catch(() => {});
  if ((await parent.getByLabel('Nombre de vuestro elfo').count()) === 0) await parent.getByRole('button', { name: /Preparativos/ }).click();
  await parent.getByLabel('Nombre de vuestro elfo').fill('Trasto');
  await parent.getByRole('radio', { name: 'Es un elfo' }).click();
  await parent.getByRole('button', { name: 'Guardar cambios' }).click();
  check('al editar la sala, cambia nombre y género', await parent.getByText('Contestas como Elfo Trasto a Lucía').waitFor({ timeout: 15000 }).then(() => true, () => false));

  // "Idea de travesura" automática con la fecha en campaña
  const p2 = await (await mk()).newPage();
  await p2.clock.setFixedTime(new Date('2026-12-05T10:00:00'));
  await p2.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  check('en campaña, el panel propone la idea del día', await p2.getByText('Idea de travesura · día 5').waitFor({ timeout: 10000 }).then(() => true, () => false));
  check('fuera de campaña no aparece sola', (await (await mk()).newPage().then(async (pg) => { await pg.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' }); return pg.getByText('Idea de travesura').count(); })) === 0);

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
