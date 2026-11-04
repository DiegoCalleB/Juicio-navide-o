const { OUT: S, FIX, BASE, launch, openChild } = require('../_lib.cjs');
const results = []; const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
(async () => {
  const b = await launch(['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required']);
  const mk = async (perm) => (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: perm ? ['microphone'] : [] })).newPage();
  const parent = await mk(false), child = await mk(true);
  const errs = []; for (const [n, p] of [['parent', parent], ['child', child]]) { p.on('pageerror', e => errs.push(n + ':' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(n + ':' + m.text().slice(0, 140)); }); }

  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Lucía'); await parent.getByRole('checkbox').check();
  check('consentimiento menciona audios', (await parent.getByText(/mensajes, audios y fotos/).count()) > 0);
  await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala real está lista');
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await parent.locator('p.font-mono').first().innerText()).trim();
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  await openChild(child, childLink, {});
  await parent.waitForSelector('[aria-label="Conectado en tiempo real"]');

  check('niño: botón de micrófono visible', await child.getByRole('button', { name: /Mantén pulsado para grabar/ }).isVisible());
  check('padres: NO hay selector de "Nota de voz" (solo texto y fotos)', (await parent.getByRole('radio', { name: 'Nota de voz' }).count()) === 0);
  await child.screenshot({ path: S + '/a1-child-mic.png' });

  // El niño graba ~2,5 s manteniendo pulsado
  const mic = child.getByRole('button', { name: /Mantén pulsado para grabar/ });
  const box = await mic.boundingBox();
  await child.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await child.mouse.down();
  await child.waitForTimeout(400);
  await parent.waitForTimeout(0);
  await child.screenshot({ path: S + '/a2-child-recording.png' });
  await child.waitForTimeout(2200);
  const t0 = Date.now();
  await child.mouse.up();
  await parent.waitForSelector('[role=log] button[aria-label="Reproducir nota de voz"]', { timeout: 10000 });
  check('el audio del niño llega a los padres', true, (Date.now() - t0) + ' ms');
  await child.waitForSelector('text=He recibido tu mensaje', { timeout: 8000 }).then(() => check('niño recibe el aviso "Papá Noel está ocupado"', true)).catch(() => check('niño recibe el aviso', false));

  // Los padres lo reproducen (audio real servido por el almacén)
  const audioInfo = await parent.evaluate(async () => {
    const res = await fetch('/api/rooms/' + location.pathname.split('/paje/')[1] + '/messages');
    const j = await res.json(); const m = j.data.messages.find(x => x.kind === 'voice');
    const r = await fetch(m.audioUrl); const buf = new Uint8Array(await r.arrayBuffer());
    return { type: r.headers.get('content-type'), bytes: buf.length, webm: buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3, dur: m.duration };
  });
  check('el audio guardado es WebM válido y se puede descargar', audioInfo.webm && audioInfo.bytes > 500, JSON.stringify(audioInfo));
  await parent.getByRole('button', { name: 'Reproducir nota de voz' }).first().click();
  await parent.waitForTimeout(600);
  check('los padres pueden reproducirlo', (await parent.getByRole('button', { name: 'Pausar nota de voz' }).count()) > 0);
  await parent.screenshot({ path: S + '/a3-parent-audio.png' });

  // Los padres contestan con texto y con foto; sin voz sintetizada
  await parent.fill('#reply', '¡Jo, jo, jo! He escuchado tu mensajito, Lucía');
  await parent.getByRole('button', { name: /Enviar como Papá Noel/ }).click();
  await child.waitForSelector('text=he escuchado tu mensajito, Lucía'.replace('he', 'He'), { timeout: 8000 }).catch(() => {});
  check('el niño recibe la respuesta de texto', (await child.getByText(/escuchado tu mensajito/).count()) > 0);
  const kingVoice = await parent.evaluate(async () => { const r = await fetch('/api/rooms/' + location.pathname.split('/paje/')[1] + '/reply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'prueba modo voz', delayMinutes: 0, mode: 'voice' }) }); return r.status; });
  const lastKing = await parent.evaluate(async () => { const j = await (await fetch('/api/rooms/' + location.pathname.split('/paje/')[1] + '/messages')).json(); return j.data.messages.filter(m => m.from === 'king').pop().kind; });
  check('aunque se pida modo voz, el personaje contesta en texto (voz apagada)', kingVoice === 201 && lastKing === 'text', 'kind=' + lastKing);
  await child.screenshot({ path: S + '/a4-child-final.png' });

  // Seguridad: audio falso y demasiado grande
  const api = async (path, fd) => (await fetch(BASE + path, { method: 'POST', body: fd })).status;
  const childToken = childLink.split('/r/')[1];
  const fake = new FormData(); fake.append('audio', new Blob(['no soy audio'], { type: 'audio/webm' }), 'x'); fake.append('duration', '3');
  check('audio falso (bytes no son WebM) → rechazado', (await api(`/api/rooms/${childToken}/voice`, fake)) === 415);
  const big = new FormData(); big.append('audio', new Blob([new Uint8Array(2_200_000)], { type: 'audio/webm' }), 'x'); big.append('duration', '3');
  check('audio demasiado grande → 413', (await api(`/api/rooms/${childToken}/voice`, big)) === 413);
  const parentToken = pajeHref.split('/paje/')[1];
  const asParent = new FormData(); asParent.append('audio', new Blob([Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3, 4])], { type: 'audio/webm' }), 'x'); asParent.append('duration', '3');
  check('los padres NO pueden subir audios como niño', (await api(`/api/rooms/${parentToken}/voice`, asParent)) === 404);
  check('sin errores de página ni consola', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(`RESUMEN: ${results.filter(Boolean).length}/${results.length} OK`);
  await b.close(); process.exit(results.every(Boolean) ? 0 : 1);
})().catch(e => { console.error('CRASH', e.message); process.exit(2); });
