// Calendario: portada de temporada (elfo, Papá Noel, Reyes, Ratoncito), campaña de Black Friday y precios. Se lanza con --now=ISO (reloj simulado FAKE_NOW).
const { BASE, launch } = require('../_lib.cjs');
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
  'elf-pre': { h1: /Un elfo travieso va a colarse en tu casa/, demo: /Soy Chispa/, char: 'duende_chispa' },
  elf: { h1: /¡El elfo travieso ya está en casa!/, demo: /Soy Chispa/, char: 'duende_chispa' },
  noel: { h1: /antes de abrir los regalos, hable con Papá Noel/, demo: /Feliz Navidad, Lucía/, char: 'papa_noel' },
  reyes: { h1: /Que los Reyes Magos le contesten en directo/, demo: /Soy Melchor/, char: 'melchor' },
  raton: { h1: /Que el Ratoncito Pérez le escriba/, demo: /se te ha caído un diente/, char: 'raton_perez' },
}[phase];

(async () => {
  console.log('Fecha simulada:', process.env.FAKE_NOW, '→ fase', phase, '· precio', price, inBF ? '(Black Friday)' : '');
  const b = await launch();
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 120000 });

  check(`portada: el botón del Pase muestra ${price}`, await page.getByRole('button', { name: new RegExp(`Conseguir el Pase · ${price.replace('.', '\\.')}`) }).isVisible());
  check(`portada: el enlace junto al botón principal muestra ${price}`, await page.getByRole('link', { name: new RegExp(`Ver el Pase de Navidad · ${price}`) }).isVisible());
  const banner = page.getByRole('link', { name: /Oferta Black Friday · Pase de Navidad a/ });
  check(inBF ? 'durante la campaña: aparece el aviso de Black Friday' : 'fuera de la campaña: no hay aviso de Black Friday', inBF ? await banner.isVisible() : (await banner.count()) === 0);
  if (inBF) {
    const txt = (await banner.innerText()).replace(/\s+/g, ' ');
    check('el aviso dice el precio y hasta cuándo', /2,99 €/.test(txt) && /hasta el lunes 30 de noviembre/.test(txt), txt);
    check('la tarjeta del Pase lleva la etiqueta de Black Friday', await page.getByText('🖤 Oferta Black Friday').first().isVisible());
    check('no hay un precio anterior tachado (sin referencias engañosas)', (await page.locator('s, del, .line-through').count()) === 0);
  } else {
    check('la tarjeta del Pase no lleva etiqueta de campaña', (await page.getByText('Oferta Black Friday').count()) === 0);
  }
  check('nunca se habla de "precio de lanzamiento" (el precio es el de temporada)', (await page.getByText(/lanzamiento/i).count()) === 0);

  // Portada de temporada
  check(`portada de temporada (${phase}): titular`, await page.getByRole('heading', { level: 1 }).filter({ hasText: EXPECT.h1 }).isVisible());
  check(`portada de temporada (${phase}): el chat de ejemplo es del personaje de la época`, await page.getByText(EXPECT.demo).first().isVisible());
  check(`portada de temporada (${phase}): sale preseleccionado ${EXPECT.char}`, (await page.locator('input[name=character]:checked').getAttribute('value')) === EXPECT.char);
  if (phase === 'elf-pre') {
    const txt = daysLeft <= 1 ? '¡Llega mañana!' : `faltan ${daysLeft} días`;
    check(`cuenta atrás hasta la llegada del elfo (${txt})`, await page.getByText(txt, { exact: false }).first().isVisible());
  } else {
    check('fuera de la cuenta atrás no se muestra', (await page.getByText(/faltan \d+ días|Llega mañana/).count()) === 0);
  }
  if (phase === 'elf' || phase === 'elf-pre') check('el chat del elfo muestra la foto de la trastada', await page.getByRole('img', { name: /Mira la trastada/ }).isVisible());

  // El pago se abre con la casilla legal y el importe vigente (Stripe simulado)
  await page.getByText(/Quiero que el pase se active ya/).click();
  await Promise.all([page.waitForURL(/\/pase\/listo/, { timeout: 20000 }), page.getByRole('button', { name: /Conseguir el Pase/ }).click()]);
  check('la compra se completa y entrega el pase', await page.getByText('¡Ya tienes tu Pase de Navidad!').isVisible());

  check('sin errores de página', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log(`\nRESUMEN: ${results.filter(Boolean).length}/${results.length} pruebas OK`);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error('CRASH', e.message); process.exit(2); });
