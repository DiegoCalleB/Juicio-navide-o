const { OUT: S, BASE, launch, openChild } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await launch();
  const mk = () => b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const parent = await (await mk()).newPage(), child = await (await mk()).newPage();
  const errs = []; for (const [n, p] of [['parent', parent], ['child', child]]) p.on('pageerror', (e) => errs.push(n + ':' + e.message));

  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  check('el selector ofrece al Duende Chispa', (await parent.getByRole('radio', { name: /Duende Chispa/ }).count()) === 1);
  await parent.fill('#child', 'Lucía');
  await parent.locator('label', { hasText: 'Duende Chispa' }).click();
  await parent.getByRole('checkbox').check();
  await parent.screenshot({ path: S + '/du1-selector.png' });
  await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala real está lista', { timeout: 30000 });
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await parent.locator('p.font-mono').first().innerText()).trim();
  const parentToken = pajeHref.split('/paje/')[1], childToken = childLink.split('/r/')[1];
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  check('panel: "Contestas como Duende Chispa a Lucía"', await parent.getByText('Contestas como Duende Chispa a Lucía').isVisible());
  const tabs = (await parent.getByRole('tab').allInnerTexts()).join('|');
  check('plantillas del duende', tabs === 'Primer saludo|Travesuras|Me has pillado|Charla', tabs);
  check('tiene el calendario de travesuras y no el "Programar" normal', await parent.getByRole('button', { name: /Calendario de travesuras/ }).isVisible() && (await parent.getByRole('button', { name: /^📅 Programar$/ }).count()) === 0);

  await child.goto(childLink.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: 'domcontentloaded' });
  await child.getByRole('button', { name: 'Abrir mensaje del Duende Chispa' }).waitFor({ timeout: 20000 });
  check('intro: "tienes un mensaje del Duende Chispa"', await child.getByText(/tienes un mensaje del Duende Chispa/).isVisible());
  await child.getByRole('button', { name: 'Abrir mensaje del Duende Chispa' }).click();
  await child.waitForSelector('#royal-draft');
  check('sala vacía: se presenta él mismo', await child.getByText('Soy Chispa, el duende travieso').isVisible());
  check('cabecera: "desde el rincón de los duendes"', await child.getByText('desde el rincón de los duendes').isVisible());
  await child.screenshot({ path: S + '/du2-child.png' });
  await child.fill('#royal-draft', '¡Te encontré detrás del sofá!'); await child.keyboard.press('Enter');
  await child.waitForSelector('text=He recibido tu mensaje', { timeout: 8000 }).then(() => check('acuse en primera persona del duende', true)).catch(() => check('acuse del duende', false));
  check('el niño no ve ayudantes ni a otros personajes', (await child.locator('body').innerText()).match(/Quesito|Cascabel|Zafiro|ayudante|Ratoncito|Melchor/i) === null);

  // Calendario: empieza hace 3 días (días 1–3 "ya pasaron") y se programa el resto
  await parent.getByRole('button', { name: /Calendario de travesuras/ }).click();
  const dlg = parent.getByRole('dialog', { name: 'Calendario de travesuras' });
  const pad = (n) => String(n).padStart(2, '0');
  const d0 = new Date(); d0.setDate(d0.getDate() - 3);
  await dlg.locator('input[type=date]').fill(`${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`);
  check('el calendario lista las 24 travesuras con su idea para los padres', (await dlg.getByRole('checkbox').count()) === 24 && await dlg.getByText('Tu parte (por la noche)').first().isVisible());
  check('los días que ya pasaron quedan desactivados', await dlg.getByRole('checkbox', { name: 'Programar el día 1', exact: true }).isDisabled());
  await parent.screenshot({ path: S + '/du3-calendar.png' });
  // Cuántos quedan por programar depende de la hora del día (si el día 4 de las 08:00 ya pasó): se lee del botón.
  const submit = dlg.getByRole('button', { name: /^Programar \d+ mensajes$/ });
  const n = Number(((await submit.innerText()).match(/\d+/) || [0])[0]);
  check('se ofrecen al menos 20 de las 24 travesuras', n >= 20 && n <= 21, String(n));
  await submit.click();
  await parent.waitForSelector(`text=${n} travesuras programadas`, { timeout: 15000 }).then(() => check(`se programan ${n} travesuras de una vez`, true)).catch(() => check(`se programan ${n} travesuras de una vez`, false));
  const list = await (await fetch(`${BASE}/api/rooms/${parentToken}/messages`)).json();
  const pending = (list.data.messages || []).filter((m) => m.pending).length;
  check(`quedan ${n} mensajes pendientes en la sala`, pending === n, String(pending));
  const childList = await (await fetch(`${BASE}/api/rooms/${childToken}/messages`)).text();
  check('el niño no ve ninguno todavía', !childList.includes('Hoy me he subido a lo más alto'));
  const post = (path, body) => fetch(`${BASE}/api/rooms/${path}/schedule`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const when = new Date(Date.now() + 3600_000).toISOString();
  check('el niño no puede programar (404)', (await post(childToken, { items: [{ text: 'x', scheduledAt: when }] })).status === 404);
  check('más de 30 mensajes → 400', (await post(parentToken, { items: Array.from({ length: 31 }, (_, i) => ({ text: 'x' + i, scheduledAt: when })) })).status === 400);
  check('fecha pasada → 400', (await post(parentToken, { items: [{ text: 'x', scheduledAt: new Date(Date.now() - 600_000).toISOString() }] })).status === 400);

  // "Travesura de hoy": con la fecha del navegador en 5 de diciembre
  const p2ctx = await mk(); const p2 = await p2ctx.newPage();
  await p2.clock.setFixedTime(new Date('2026-12-05T10:00:00'));
  await p2.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  check('el 5 de diciembre el panel muestra "Travesura de hoy · día 5"', await p2.getByText('Travesura de hoy · día 5').waitFor({ timeout: 10000 }).then(() => true, () => false));
  await p2.getByRole('button', { name: 'Usar el mensaje de hoy' }).click();
  check('"Usar el mensaje de hoy" rellena el mensaje con su nombre', (await p2.inputValue('#reply')).includes('té') && (await p2.inputValue('#reply')).includes('Lucía'));
  await p2.screenshot({ path: S + '/du4-today.png' });
  check('fuera de campaña no aparece (hoy real)', (await parent.getByText('Travesura de hoy').count()) === 0);

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
