// Prueba gratis (acortada a 45 s), Pase de Navidad con Stripe simulado, pase de regalo y nivel de lectura.
// Se lanza aparte: npm run test:e2e -- --billing
const { BASE, launch, openChild } = require('../_lib.cjs');
const results = [];
const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };
const crypto = require('crypto');
const local = (u) => u.replace(/^https?:\/\/[^/]+/, BASE);

(async () => {
  const b = await launch();
  const ctxA = await b.newContext({ viewport: { width: 390, height: 844 } });
  const ctxKid = await b.newContext({ viewport: { width: 390, height: 844 } });
  const ctxB = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (otra familia) E2E' });
  const page = await ctxA.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));

  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  check('portada: anuncia la prueba gratis y el precio', await page.getByText(/Gratis 3 días · después, Pase de Navidad 3,99 €/).isVisible());
  check('portada: mensaje para primeros lectores', await page.getByText(/Ideal para primeros lectores/).isVisible());

  const create = async (name, reading) => {
    await page.fill('#child', name);
    if (reading) await page.getByRole('radio', { name: reading }).click();
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /Crear la sala/ }).click();
  };
  const linksAfterCreate = async () => {
    await page.waitForSelector('text=La sala real está lista', { timeout: 30000 });
    const panel = await page.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
    const child = (await page.locator('p.font-mono').first().innerText()).trim();
    return { panel: local(panel), child: local(child) };
  };

  await create('Lucía', 'Está empezando');
  const t0 = Date.now();
  const r1 = await linksAfterCreate();
  check('sala 1: es una prueba gratis de 3 días', await page.getByText(/Prueba gratis de 3 días/).isVisible());
  await page.getByRole('button', { name: /Preparar otra sala/ }).click();
  await create('Mateo');
  const r2 = await linksAfterCreate();
  await page.getByRole('button', { name: /Preparar otra sala/ }).click();
  await create('Pablo');
  await page.getByText(/Ya has usado la prueba gratis/).waitFor({ timeout: 15000 }).catch(() => {});
  check('3ª prueba en el mismo móvil: avisa y ofrece el pase', (await page.getByText(/Ya has usado la prueba gratis/).count()) > 0 && await page.getByRole('button', { name: /Conseguir el Pase · 3,99 €/ }).isVisible());

  // Panel y niño de la sala 1
  const panel = await ctxA.newPage();
  await panel.goto(r1.panel, { waitUntil: 'networkidle' });
  await panel.getByText(/Prueba gratis · queda/).waitFor({ timeout: 15000 }).catch(() => {});
  check('panel: indica la prueba y el tiempo que queda', await panel.getByText(/Prueba gratis · queda/).isVisible());
  check('panel: consejo para primeros lectores', await panel.getByText(/Está aprendiendo a leer/).isVisible());
  const kid = await ctxKid.newPage();
  await openChild(kid, r1.child, {});
  check('niño: ve el texto en MAYÚSCULAS por su nivel de lectura', /uppercase/.test((await kid.locator('[role=log]').getAttribute('class')) ?? ''));

  // Fin de la prueba
  const wait = Math.max(0, 47000 - (Date.now() - t0));
  await panel.waitForTimeout(wait);
  await panel.getByText('La prueba gratis ha terminado').waitFor({ timeout: 15000 }).catch(() => {});
  check('panel: al acabar la prueba, ofrece el pase', await panel.getByText('La prueba gratis ha terminado').isVisible());
  await kid.getByText(/se ha ido a preparar la magia/).waitFor({ timeout: 15000 }).catch(() => {});
  check('niño: nota del personaje en lugar del teclado', await kid.getByText(/se ha ido a preparar la magia/).isVisible());
  const childToken = r1.child.split('/r/')[1].split('?')[0];
  const status = await kid.evaluate(async (t) => (await fetch(`/api/rooms/${t}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'hola' }) })).status, childToken);
  check('servidor: rechaza mensajes nuevos con la prueba acabada (402)', status === 402, String(status));
  const kidText = await kid.locator('body').innerText();
  check('niño: nunca ve precios ni avisos de pago', !/pase|€|prueba gratis|pagar/i.test(kidText));

  // Pagar desde el panel (Stripe simulado)
  await panel.getByRole('button', { name: /Conseguir el Pase/ }).click();
  check('sin la casilla de desistimiento no se abre el pago', await panel.getByText('Marca la casilla para continuar.').isVisible());
  await panel.getByText(/Quiero que el pase se active ya/).click();
  await Promise.all([panel.waitForURL(/\/pase\/listo/, { timeout: 20000 }), panel.getByRole('button', { name: /Conseguir el Pase/ }).click()]);
  await panel.waitForLoadState('networkidle');
  check('pago completado: muestra el pase', await panel.getByText('¡Ya tienes tu Pase de Navidad!').isVisible());
  const wa = await panel.getByRole('link', { name: 'Regalar por WhatsApp' }).getAttribute('href');
  const giftLink = decodeURIComponent(wa.split('text=')[1]).match(/https?:\/\/\S+/)[0];
  check('incluye un enlace de regalo', /\?pase=[A-Za-z0-9_-]{43}$/.test(giftLink), giftLink.slice(-20));
  await panel.getByRole('link', { name: 'Volver a mi panel' }).click();
  await panel.waitForSelector('#reply', { timeout: 15000 }).catch(() => {});
  check('de vuelta al panel: la sala ya no tiene límite', (await panel.locator('#reply').count()) === 1 && (await panel.getByText('La prueba gratis ha terminado').count()) === 0);
  await kid.waitForSelector('text=se ha ido a preparar la magia', { state: 'detached', timeout: 15000 }).catch(() => {});
  check('niño: puede volver a escribir sin recargar', (await kid.getByText(/se ha ido a preparar la magia/).count()) === 0);

  // Sala 2: usar el pase guardado en este móvil
  const panel2 = await ctxA.newPage();
  await panel2.goto(r2.panel, { waitUntil: 'networkidle' });
  await panel2.getByRole('button', { name: 'Usar mi pase en esta sala' }).waitFor({ timeout: 15000 }).catch(() => {});
  check('otra sala caducada: ofrece usar el pase de este móvil', await panel2.getByRole('button', { name: 'Usar mi pase en esta sala' }).isVisible());
  await panel2.getByRole('button', { name: 'Usar mi pase en esta sala' }).click();
  await panel2.waitForSelector('#reply', { timeout: 15000 }).catch(() => {});
  check('con un toque, desbloqueada', (await panel2.locator('#reply').count()) === 1);

  // Salas nuevas con el pase
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  check('portada: recuerda que hay un pase en este móvil', await page.getByText(/Tienes un Pase de Navidad en este móvil/).isVisible());
  await create('Pablo');
  await page.waitForSelector('text=La sala real está lista', { timeout: 30000 });
  check('con el pase, la sala nueva no tiene límite', await page.getByText(/Con tu Pase de Navidad/).isVisible());

  // Pase de regalo en otra familia
  const other = await ctxB.newPage();
  await other.goto(local(giftLink), { waitUntil: 'networkidle' });
  await other.getByText('🎁 ¡Tienes un Pase de Navidad!').waitFor({ timeout: 15000 }).catch(() => {});
  check('regalo: la otra familia ve su pase', await other.getByText('🎁 ¡Tienes un Pase de Navidad!').isVisible());
  check('regalo: el enlace se quita de la barra de direcciones', !other.url().includes('pase='));
  await other.fill('#child', 'Martina');
  await other.getByRole('checkbox').first().check();
  await other.getByRole('button', { name: /Crear la sala/ }).click();
  await other.waitForSelector('text=La sala real está lista', { timeout: 30000 });
  check('regalo: su sala nace sin límite', await other.getByText(/Con tu Pase de Navidad/).isVisible());

  // Webhook de Stripe: firma obligatoria e idempotente
  const hook = async (body, sig) => (await fetch(BASE + '/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': sig, 'content-type': 'application/json' }, body })).status;
  const evt = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_webhook_e2e_1', payment_status: 'paid', status: 'complete', amount_total: 399, metadata: {} } } });
  const t = Math.floor(Date.now() / 1000);
  const good = `t=${t},v1=${crypto.createHmac('sha256', 'whsec_e2e_test_secret_123456').update(`${t}.${evt}`).digest('hex')}`;
  check('webhook: rechaza una firma falsa', (await hook(evt, `t=${t},v1=deadbeef`)) === 400);
  check('webhook: rechaza una firma antigua (más de 5 min)', (await hook(evt, `t=${t - 900},v1=${crypto.createHmac('sha256', 'whsec_e2e_test_secret_123456').update(`${t - 900}.${evt}`).digest('hex')}`)) === 400);
  const s1 = await hook(evt, good), s2 = await hook(evt, good);
  check('webhook: acepta la firma válida y es idempotente', s1 === 200 && s2 === 200, `${s1}/${s2}`);

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
