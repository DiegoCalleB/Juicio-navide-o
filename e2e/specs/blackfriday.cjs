// Calendario: portada de temporada (elfo, Papá Noel, Reyes, Ratoncito), campaña de Black Friday y precios. Se lanza con --now=ISO (reloj simulado FAKE_NOW).
const { BASE, launch , nextStep } = require('../_lib.cjs');
const results = [];
const check = (n, ok, x = '') => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  → ' + x : '')); };

const now = new Date(process.env.FAKE_NOW);
const y = now.getUTCFullYear();
const t = (d) => Date.parse(`${y}-${d}T00:00:00+01:00`);
const DAY = 86_400_000;
const inBF = now.getTime() >= t('11-27') && now.getTime() < t('11-30') + DAY;
const price = inBF ? '2,99 €' : '3,99 €';
// Fase de la portada (misma regla que lib/brand.ts, en hora de España)
const today = Math.floor((now.getTime() + 3_600_000) / DAY);
const day = (md) => Math.floor((t(md) + 3_600_000) / DAY);
const phase = today >= day('11-01') && today < day('12-01') ? 'elf-pre' : today >= day('12-01') && today < day('12-15') ? 'elf'
  : today >= day('12-15') && today < day('12-26') ? 'noel' : (today >= day('12-26') || now.getTime() < t('01-07')) ? 'reyes' : now.getTime() >= t('10-15') && now.getTime() < t('11-01') ? 'noel' : 'raton';
const daysLeft = day('12-01') - today;
const EXPECT = {
  'elf-pre': { h1: /Un elfo travieso va a colarse en tu casa/, demo: /Soy Chispa/, char: 'duende_chispa', tag: 'Un elfo muy travieso' },
  elf: { h1: /¡El elfo travieso ya está en casa!/, demo: /Soy Chispa/, char: 'duende_chispa', tag: 'Un elfo muy travieso' },
  noel: { h1: /antes de abrir los regalos, hable con Papá Noel/, demo: /Feliz Navidad, Lucía/, char: 'papa_noel', tag: 'Desde el Polo Norte' },
  reyes: { h1: /Que los Reyes Magos le contesten en directo/, demo: /Soy Melchor/, char: 'melchor', tag: 'Cariñoso y abuelete' },
  raton: { h1: /Que el Ratoncito Pérez le escriba/, demo: /se te ha caído un diente/, char: 'raton_perez', tag: 'Recoge dientes' },
}[phase];

(async () => {
  console.log('Fecha simulada:', process.env.FAKE_NOW, '→ fase', phase, '· precio', price, inBF ? '(Black Friday)' : '');
  const b = await launch();
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });

  check('portada (la puede ver un peque): sin precios ni ofertas', (await page.getByText(/€|Black Friday|Pase de Navidad/).count()) === 0);
  // La pestaña y la vista previa siguen a la portada de temporada (mismo gancho que el titular)
  const tagline = ((await page.locator('header > p').nth(1).textContent()) || '').trim();
  const og = await page.locator('meta[property="og:title"]').getAttribute('content');
  check(`pestaña (${phase}): el título sigue a la portada («${tagline}»)`, tagline.length > 5 && (await page.title()) === `Línea Mágica · ${tagline}` && og === `Línea Mágica · ${tagline}`, `${await page.title()} | ${og}`);
  // Portada de temporada
  check(`portada de temporada (${phase}): titular`, await page.getByRole('heading', { level: 1 }).filter({ hasText: EXPECT.h1 }).isVisible());
  check(`portada de temporada (${phase}): el chat de ejemplo es del personaje de la época`, await page.getByText(EXPECT.demo).first().isVisible());
  if (phase === 'elf-pre') {
    const txt = daysLeft <= 1 ? '¡Llega mañana!' : `faltan ${daysLeft} días`;
    check(`cuenta atrás hasta la llegada del elfo (${txt})`, await page.getByText(txt, { exact: false }).first().isVisible());
  } else {
    check('fuera de la cuenta atrás no se muestra', (await page.getByText(/faltan \d+ días|Llega mañana/).count()) === 0);
  }
  if (phase === 'elf' || phase === 'elf-pre') check('el chat del elfo muestra la foto de la trastada', await page.getByRole('img', { name: /Mira la trastada/ }).isVisible());


  // Zona de mayores: el enlace a precios lleva el del Pase y, en campaña, la oferta
  await page.goto(BASE + '/mayores', { waitUntil: 'networkidle' });
  const offer = page.getByRole('link', { name: new RegExp(`Pase de Navidad ${price}`) });
  check(`zona de mayores: el enlace a precios muestra ${price}`, await offer.isVisible());
  const offerTxt = (await offer.innerText()).replace(/\s+/g, ' ');
  if (inBF) check('durante la campaña: dice Black Friday y hasta cuándo', /Oferta Black Friday/.test(offerTxt) && /hasta el lunes 30 de noviembre/i.test(offerTxt), offerTxt);
  else check('fuera de la campaña: no hay aviso de Black Friday', !/Black Friday/.test(offerTxt), offerTxt);

  await page.goto(BASE + '/precios', { waitUntil: 'networkidle' });
  check(`precios: el botón del Pase muestra ${price}`, await page.getByRole('button', { name: new RegExp(`Conseguir el Pase · ${price.replace('.', '\\.')}`) }).isVisible());
  if (inBF) {
    check('la tarjeta del Pase lleva la etiqueta de Black Friday', await page.getByText('🖤 Oferta Black Friday').first().isVisible());
    check('no hay un precio anterior tachado (sin referencias engañosas)', (await page.locator('s, del, .line-through').count()) === 0);
  } else {
    check('la tarjeta del Pase no lleva etiqueta de campaña', (await page.getByText('Oferta Black Friday').count()) === 0);
  }
  check('nunca se habla de "precio de lanzamiento" (el precio es el de temporada)', (await page.getByText(/lanzamiento/i).count()) === 0);
  // Crear: ningún personaje marcado y el de temporada destacado
  await page.goto(BASE + '/crear', { waitUntil: 'networkidle' });
  await page.fill('#child', 'Lucía'); await page.locator('form').getByRole('checkbox').check();
  await nextStep(page);
  check(`crear (${phase}): ningún personaje viene marcado (se ven todos)`, (await page.locator('input[name=character]:checked').count()) === 0);
  check(`crear (${phase}): ${EXPECT.char} lleva la etiqueta "De temporada"`, (await page.locator('label', { hasText: EXPECT.tag }).filter({ hasText: 'De temporada' }).count()) === 1 && (await page.getByText('De temporada').count()) === 1);
  await page.goto(BASE + '/precios', { waitUntil: 'networkidle' });

  // El pago se abre con la casilla legal y el importe vigente (Stripe simulado)
  await page.getByText(/Quiero que el pase se active ya/).click();
  await Promise.all([page.waitForURL(/\/pase\/listo/, { timeout: 20000 }), page.getByRole('button', { name: /Conseguir el Pase/ }).click()]);
  check('la compra se completa y entrega el pase', await page.getByText('¡Ya tienes tu Pase de Navidad!').isVisible());

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
