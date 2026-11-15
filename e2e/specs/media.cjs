const { OUT: S, FIX, BASE, launch, openChild, ensureFixtures, ensureChar } = require('../_lib.cjs');
const { childLinkOf, familyLinkOf } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  await ensureFixtures();
  const b = await launch(['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required']);
  const mk = async (perm) => (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: perm ? ['microphone'] : [] })).newPage();
  const parent = await mk(false), child = await mk(true);
  const errs = []; for (const [n, p] of [['parent', parent], ['child', child]]) p.on('pageerror', (e) => errs.push(n + ':' + e.message));

  await parent.goto(BASE + '/crear', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Lucía'); await parent.getByRole('checkbox').check();
  await ensureChar(parent); await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala está lista');
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await childLinkOf(parent));
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  await openChild(child, childLink, {});
  await parent.waitForSelector('[aria-label="Conectado en tiempo real"]');

  // ── Cámara: dos caminos (hacer una foto / elegir una)
  await child.getByRole('button', { name: 'Enviar una foto' }).click();
  check('niño: el botón de foto ofrece "Hacer una foto" y "Elegir una foto"', await child.getByRole('menuitem', { name: /Hacer una foto/ }).isVisible() && await child.getByRole('menuitem', { name: /Elegir una foto/ }).isVisible());
  await child.screenshot({ path: S + '/me1-child-photo-menu.png' });
  check('"Hacer una foto" abre la cámara del móvil (capture=environment)', (await child.getByTestId('camera-input').getAttribute('capture')) === 'environment');
  check('"Elegir una foto" no fuerza la cámara', (await child.getByTestId('photo-input').getAttribute('capture')) === null);
  await child.keyboard.press('Escape');
  check('Escape cierra el menú', (await child.getByRole('menu').count()) === 0);
  await child.getByTestId('camera-input').setInputFiles(FIX + '/foto-nino.jpg');
  await parent.waitForSelector('img[alt="Foto"]', { timeout: 15000 });
  check('foto hecha con la cámara del niño llega a los padres', true);

  await parent.getByRole('button', { name: 'Adjuntar una foto' }).click();
  check('padres: también pueden hacer una foto o elegirla', await parent.getByRole('menuitem', { name: /Hacer una foto/ }).isVisible() && (await parent.getByTestId('camera-input').getAttribute('capture')) === 'environment');
  await parent.screenshot({ path: S + '/me2-parent-photo-menu.png' });
  // Toque real (como un dedo): si algo tapa el menú, Playwright no puede pulsarlo.
  const realPick = async (page, btnName, item, file) => {
    if ((await page.getByRole('menu').count()) === 0) await page.getByRole('button', { name: btnName }).click();
    await page.waitForTimeout(400);
    try {
      const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }), page.getByRole('menuitem', { name: item }).click({ timeout: 4000 })]);
      await fc.setFiles(file);
      return true;
    } catch (e) { console.log('   ' + e.message.split('\n')[0]); return false; }
  };
  await parent.screenshot({ path: S + '/me2b-parent-photo-menu-open.png' });
  // "Hacer una foto" abre la cámara DENTRO de la web (en Android, saltar a la app de cámara puede cerrar Chrome por memoria)
  await parent.getByRole('menuitem', { name: /Hacer una foto/ }).click();
  const camOpen = await parent.getByRole('dialog', { name: 'Cámara' }).waitFor({ timeout: 5000 }).then(() => true, () => false);
  const camLive = camOpen && (await parent.waitForFunction(() => { const v = document.querySelector('[data-testid=in-app-camera]'); return v && v.videoWidth > 0; }, null, { timeout: 10000 }).then(() => true, () => false));
  check('padres: "Hacer una foto" abre la cámara dentro de la web', camOpen && camLive);
  await parent.screenshot({ path: S + '/me2c-in-app-camera.png' });
  if (camLive) await parent.getByRole('button', { name: 'Hacer la foto' }).click();
  check('padres: la foto hecha con la cámara de la web queda lista', camLive && (await parent.getByText('Foto lista').waitFor({ timeout: 10000 }).then(() => true, () => false)));
  check('la cámara se apaga al hacer la foto', (await parent.getByRole('dialog', { name: 'Cámara' }).count()) === 0);
  await parent.getByRole('button', { name: 'Quitar la foto' }).click().catch(() => undefined);
  // Cancelar cierra sin adjuntar nada
  await parent.getByRole('button', { name: 'Adjuntar una foto' }).click();
  await parent.getByRole('menuitem', { name: /Hacer una foto/ }).click();
  await parent.getByRole('button', { name: 'Cancelar' }).click();
  check('Cancelar cierra la cámara sin adjuntar foto', (await parent.getByRole('dialog', { name: 'Cámara' }).count()) === 0 && (await parent.getByText('Foto lista').count()) === 0);
  check('padres: tocar "Elegir una foto" abre la galería de verdad', await realPick(parent, 'Adjuntar una foto', /Elegir una foto/, FIX + '/foto-padres.png'));
  await parent.getByRole('button', { name: 'Quitar la foto' }).click().catch(() => undefined);
  check('niño: tocar "Elegir una foto" abre la galería de verdad', await realPick(child, 'Enviar una foto', /Elegir una foto/, FIX + '/foto-nino.jpg'));
  // Foto enorme (48 MP, como las de los móviles nuevos): se prepara y se envía igual.
  const fs = require('fs');
  if (!fs.existsSync(FIX + '/foto-48mp.jpg')) {
    await require('sharp')({ create: { width: 8064, height: 6048, channels: 3, background: { r: 200, g: 60, b: 60 } } }).jpeg({ quality: 95 }).toFile(FIX + '/foto-48mp.jpg');
  }
  {
    await parent.getByTestId('photo-input').setInputFiles(FIX + '/foto-48mp.jpg');
    const ok48 = await parent.getByText('Foto lista').waitFor({ timeout: 20000 }).then(() => true, () => false);
    let sent48 = false;
    if (ok48) {
      const before = await child.locator('[role=log] img').count();
      await parent.getByRole('button', { name: /Enviar foto como/ }).click();
      sent48 = await child.waitForFunction((n) => document.querySelectorAll('[role=log] img').length > n, before, { timeout: 20000 }).then(() => true, () => false);
    }
    check('padres: una foto de 48 MP se prepara y le llega al niño', ok48 && sent48);
  }
  await parent.getByTestId('camera-input').setInputFiles(FIX + '/foto-padres.png');
  check('padres: la foto de la cámara queda lista para enviar', await parent.getByText('Foto lista').waitFor({ timeout: 10000 }).then(() => true, () => false));

  // ── Audios seguidos: se reproducen en cadena
  const mic = child.getByRole('button', { name: /Mantén pulsado para grabar/ });
  for (let i = 0; i < 3; i++) {
    const box = await mic.boundingBox();
    await child.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await child.mouse.down(); await child.waitForTimeout(1600); await child.mouse.up();
    await child.waitForFunction((n) => document.querySelectorAll('[role=log] button[aria-label="Reproducir nota de voz"]').length >= n, i + 1, { timeout: 10000 });
  }
  await parent.waitForFunction(() => document.querySelectorAll('[role=log] button[aria-label*="nota de voz"]').length >= 3, null, { timeout: 15000 });
  check('los padres reciben las 3 notas seguidas', true);

  // Seguimos solo qué nota está sonando (índice) mientras avanza la cadena
  await parent.evaluate(() => {
    window.__seq = [];
    const sample = () => {
      const btns = [...document.querySelectorAll('[role=log] button[aria-label*="nota de voz"]')];
      const i = btns.findIndex((x) => x.getAttribute('aria-label') === 'Pausar nota de voz');
      if (i >= 0 && window.__seq[window.__seq.length - 1] !== i) window.__seq.push(i);
    };
    window.__t = setInterval(sample, 50);
  });
  await parent.getByRole('button', { name: 'Reproducir nota de voz' }).first().click();
  await parent.waitForTimeout(9000);
  const seq = await parent.evaluate(() => { clearInterval(window.__t); return window.__seq; });
  check('al terminar la 1.ª suenan solas la 2.ª y la 3.ª, en orden', JSON.stringify(seq) === '[0,1,2]', JSON.stringify(seq));
  check('al final no queda ninguna sonando', (await parent.getByRole('button', { name: 'Pausar nota de voz' }).count()) === 0);

  // Solo una a la vez
  const plays = parent.getByRole('button', { name: 'Reproducir nota de voz' });
  await plays.nth(0).click(); await parent.waitForTimeout(300);
  await plays.nth(1).click(); await parent.waitForTimeout(400);
  check('al empezar otra nota, la anterior se detiene (solo suena una)', (await parent.getByRole('button', { name: 'Pausar nota de voz' }).count()) === 1);
  await parent.getByRole('button', { name: 'Pausar nota de voz' }).click();
  check('se puede pausar', (await parent.getByRole('button', { name: 'Pausar nota de voz' }).count()) === 0);

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
