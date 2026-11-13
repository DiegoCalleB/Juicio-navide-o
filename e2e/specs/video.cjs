const fs = require('fs');
const { childLinkOf, familyLinkOf, ensureChar } = require('../_lib.cjs');
const { OUT: S, FIX, BASE, launch, openChild, pinSetup } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };

async function setup(browser, { perm }) {
  const mk = async (permissions) => (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions, acceptDownloads: true })).newPage();
  const parent = await mk(perm ? ['camera', 'microphone'] : []), child = await mk([]);
  const errs = []; for (const [n, p] of [['parent', parent], ['child', child]]) { p.on('pageerror', e => errs.push(n + ':' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|getUserMedia|NotAllowed|Permission/i.test(m.text())) errs.push(n + ':' + m.text().slice(0, 140)); }); }
  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Lucía'); await parent.getByRole('checkbox').check();
  await ensureChar(parent); await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala está lista');
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await childLinkOf(parent));
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  await pinSetup(parent);
  await openChild(child, childLink, {});
  await parent.waitForSelector('[aria-label="Conectado en tiempo real"]');
  return { parent, child, errs };
}

(async () => {
  // ── A. Con permisos (cámara y micro simulados)
  const b = await launch(['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']);
  const { parent, child, errs } = await setup(b, { perm: true });

  check('selector "Con otro móvil / Con este móvil" visible', await parent.getByRole('radio', { name: 'Con este móvil' }).isVisible());
  check('por defecto: "otro móvil"', (await parent.getByRole('radio', { name: 'Con otro móvil' }).getAttribute('aria-checked')) === 'true');
  await parent.getByRole('radio', { name: 'Con este móvil' }).click();
  check('explica que el vídeo no se sube a ningún sitio', await parent.getByText(/no se sube a ningún sitio/).first().isVisible());
  await parent.screenshot({ path: S + '/r1-parent-option.png' });

  await parent.fill('#reply', 'Lucía, ¡tengo una sorpresa preparada para ti!');
  await parent.getByRole('button', { name: /Empezar la sorpresa/ }).click();
  await parent.waitForSelector('[role=dialog][aria-label="Cámara para grabar la reacción"]', { timeout: 10000 });
  check('se abre la cámara con la cuenta atrás', true);
  await parent.waitForTimeout(1500);
  const live = await parent.evaluate(() => { const v = document.querySelector('[aria-label="Cámara para grabar la reacción"] video'); return v && v.readyState >= 2 && v.videoWidth > 0 ? v.videoWidth + 'x' + v.videoHeight : null; });
  check('la vista previa de la cámara está activa', !!live, String(live));
  await parent.screenshot({ path: S + '/r2-camera-countdown.png' });
  check('el niño no recibe nada durante la cuenta atrás', (await child.getByText('tengo una sorpresa').count()) === 0);

  await child.waitForSelector('[role=dialog][aria-label="Mensaje de Papá Noel"]', { timeout: 15000 });
  check('al llegar a cero la sorpresa llega al niño', true);
  await parent.waitForSelector('[role=timer]', { timeout: 5000 });
  check('la grabación empieza (indicador REC)', true);
  await parent.waitForTimeout(2500);
  await parent.screenshot({ path: S + '/r3-recording.png' });

  // Minimizar y seguir usando el panel
  await parent.getByRole('button', { name: 'Minimizar' }).click();
  await parent.waitForTimeout(300);
  check('se puede minimizar y seguir usando el panel', await parent.locator('#reply').isVisible() && await parent.getByRole('button', { name: 'Parar' }).isVisible());
  await parent.screenshot({ path: S + '/r4-minimized.png' });
  await parent.fill('#reply', 'Mientras grabo, sigo contestando'); await parent.getByRole('button', { name: /Enviar como Papá Noel/ }).click();
  await child.waitForSelector('text=Mientras grabo, sigo contestando', { timeout: 10000 }).then(() => check('mientras se graba, los padres pueden seguir contestando', true)).catch(() => check('mientras se graba, los padres pueden seguir contestando', false));
  await parent.getByRole('button', { name: 'Parar' }).click();
  await parent.waitForSelector('[role=dialog][aria-label="Tu vídeo"]', { timeout: 15000 });
  check('al parar se abre la revisión del vídeo', true);
  await parent.waitForTimeout(500);
  const vid = await parent.evaluate(async () => { const v = document.querySelector('[aria-label="Tu vídeo"] video'); await new Promise(r => v.readyState >= 1 ? r() : v.addEventListener('loadedmetadata', r, { once: true })); return { w: v.videoWidth, h: v.videoHeight, src: v.src.slice(0, 5) }; });
  check('el vídeo grabado se carga con dimensiones reales', vid.w > 0 && vid.h > 0 && vid.src === 'blob:', JSON.stringify(vid));
  check('avisa de que el vídeo no se ha subido', await parent.getByText(/no lo hemos subido a ningún sitio/).isVisible());
  await parent.screenshot({ path: S + '/r5-review.png' });

  const [download] = await Promise.all([parent.waitForEvent('download', { timeout: 10000 }), parent.getByRole('button', { name: 'Guardar en el móvil' }).click()]);
  const name = download.suggestedFilename(); const path = await download.path();
  check('se guarda con un nombre limpio y con contenido', /^reaccion-lucia-\d{4}-\d{2}-\d{2}\.(mp4|webm)$/.test(name) && fs.statSync(path).size > 10000, name + ' · ' + (fs.statSync(path).size) + ' B');
  check('la cámara se ha liberado al parar', await parent.evaluate(async () => { const d = await navigator.mediaDevices.enumerateDevices(); return true; }) );

  // La sorpresa se envió UNA sola vez
  const surprises = await parent.evaluate(async () => { const j = await (await fetch('/api/rooms/' + location.pathname.split('/paje/')[1] + '/messages')).json(); return j.data.messages.filter(m => m.effect === 'surprise').length; });
  check('la sorpresa se envió exactamente una vez', surprises === 1, 'enviadas: ' + surprises);

  // Descartar con doble confirmación
  await parent.getByRole('button', { name: 'Descartar' }).click();
  check('descartar pide confirmación', await parent.getByText('Pulsa otra vez para descartar el vídeo').isVisible());
  await parent.getByRole('button', { name: /Pulsa otra vez/ }).click();
  await parent.waitForTimeout(300);
  check('tras descartar vuelve al panel', (await parent.locator('[aria-label="Tu vídeo"]').count()) === 0 && await parent.locator('#reply').isVisible());

  // Cancelar la cuenta atrás con cámara
  await parent.fill('#reply', 'Sorpresa que se cancela'); await parent.getByRole('button', { name: /Empezar la sorpresa/ }).click();
  await parent.waitForSelector('[aria-label="Cámara para grabar la reacción"]');
  await parent.getByRole('button', { name: 'Cancelar' }).click();
  await parent.waitForTimeout(6500);
  check('cancelar cierra la cámara y no envía nada', (await parent.locator('[aria-label="Cámara para grabar la reacción"]').count()) === 0 && (await child.getByText('Sorpresa que se cancela').count()) === 0);
  check('sin errores de página ni consola (con permisos)', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();

  // ── B. Sin permisos: debe explicarlo y NO arrancar la cuenta atrás
  const b2 = await launch(['--no-sandbox']);
  const s2 = await setup(b2, { perm: false });
  await s2.parent.getByRole('radio', { name: 'Con este móvil' }).click();
  await s2.parent.fill('#reply', 'Mensaje de prueba sin permisos');
  await s2.parent.getByRole('button', { name: /Empezar la sorpresa/ }).click();
  await s2.parent.waitForSelector('text=No se ha encontrado una cámara', { timeout: 8000 }).then(() => check('sin cámara en el dispositivo: mensaje claro', true)).catch(() => check('sin cámara en el dispositivo: mensaje claro', false));
  await s2.parent.waitForTimeout(6500);
  check('sin permiso: no se envía la sorpresa por error', (await s2.child.getByText('Mensaje de prueba sin permisos').count()) === 0);
  await s2.parent.screenshot({ path: S + '/r6-no-permission.png' });
  await b2.close();

  // ── C. Permiso denegado por el usuario (NotAllowedError)
  const b3 = await launch(['--no-sandbox']);
  const s3 = await setup(b3, { perm: false });
  await s3.parent.evaluate(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denegado', 'NotAllowedError')); });
  await s3.parent.getByRole('radio', { name: 'Con este móvil' }).click();
  await s3.parent.fill('#reply', 'Mensaje con permiso denegado');
  await s3.parent.getByRole('button', { name: /Empezar la sorpresa/ }).click();
  await s3.parent.waitForSelector('text=Permite el acceso a la cámara y al micrófono', { timeout: 8000 }).then(() => check('permiso denegado: explica cómo permitirlo', true)).catch(() => check('permiso denegado: explica cómo permitirlo', false));
  await s3.parent.waitForTimeout(6500);
  check('permiso denegado: no se envía la sorpresa', (await s3.child.getByText('Mensaje con permiso denegado').count()) === 0);
  await b3.close();

  console.log(`RESUMEN: ${results.filter(Boolean).length}/${results.length} OK`);
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch(e => { console.error('CRASH', e.message); process.exit(2); });
