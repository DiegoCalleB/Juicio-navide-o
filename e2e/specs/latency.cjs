const { BASE, launch, openChild } = require('../_lib.cjs');
(async () => {
  const b = await launch(['--no-sandbox']);
  const mk = async () => (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const parent = await mk(), child = await mk();
  await parent.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });
  await parent.fill('#child', 'Marta'); await parent.getByRole('checkbox').check();
  await parent.getByRole('button', { name: /Crear la sala/ }).click();
  await parent.waitForSelector('text=La sala real está lista');
  const pajeHref = await parent.getByRole('link', { name: /Abrir mi panel/ }).getAttribute('href');
  const childLink = (await parent.locator('p.font-mono').first().innerText()).trim();
  await parent.goto(BASE + pajeHref.replace(/^https?:\/\/[^/]+/, ''), { waitUntil: 'networkidle' });
  await openChild(child, childLink, {});
  await parent.waitForSelector('[aria-label="Conectado en tiempo real"]');
  const up = [], down = [];
  for (let i = 1; i <= 6; i++) {
    const txt = `ida-${i}-${Date.now() % 100000}`;
    await child.fill('#royal-draft', txt);
    const t = Date.now(); await child.keyboard.press('Enter');
    await parent.waitForSelector(`text=${txt}`, { timeout: 8000 }); up.push(Date.now() - t);
    const back = `vuelta-${i}-${Date.now() % 100000}`;
    await parent.fill('#reply', back);
    await parent.waitForTimeout(300);
    const t2 = Date.now(); await parent.getByRole('button', { name: /Enviar como/ }).click();
    await child.waitForSelector(`text=${back}`, { timeout: 8000 }); down.push(Date.now() - t2);
  }
  const med = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  console.log('niño→padres ms:', up.join(', '), '| mediana', med(up));
  console.log('padres→niño ms:', down.join(', '), '| mediana', med(down));
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
