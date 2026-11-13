/** Utilidades comunes de las pruebas E2E. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.env.E2E_BASE || 'http://localhost:3800';
const OUT = process.env.E2E_OUT || path.join(__dirname, 'out');
const FIX = path.join(__dirname, '.fixtures');
fs.mkdirSync(OUT, { recursive: true });

/** Chromium: usa CHROMIUM_PATH si existe (p. ej. entornos sin descarga de navegadores). */
const launch = (args = []) =>
  chromium.launch({
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    args: ['--no-sandbox', ...args.filter((a) => a !== '--no-sandbox')],
  });

/** Genera las fotos de prueba la primera vez (dibujadas en un canvas; sin dependencias). */
async function ensureFixtures() {
  if (fs.existsSync(path.join(FIX, 'foto-nino.jpg')) && fs.existsSync(path.join(FIX, 'foto-padres.png'))) return;
  fs.mkdirSync(FIX, { recursive: true });
  const b = await launch();
  const page = await b.newPage();
  const make = (w, h, type, bg) =>
    page.evaluate(
      ([w, h, type, bg]) => {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.fillStyle = '#fff';
        for (let i = 0; i < w; i += 80) { g.beginPath(); g.arc(i + 60, 260 + (i % 240), 60, 0, 7); g.fill(); }
        return c.toDataURL(type, 0.92);
      },
      [w, h, type, bg],
    );
  const save = (file, dataUrl) => fs.writeFileSync(path.join(FIX, file), Buffer.from(dataUrl.split(',')[1], 'base64'));
  save('foto-nino.jpg', await make(1600, 1200, 'image/jpeg', '#d33'));
  save('foto-padres.png', await make(900, 700, 'image/png', '#147a3c'));
  await b.close();
}

/** Abre el enlace del niño y pasa la pantalla de entrada (toca el sello cuando aparece). */
async function openChild(page, link, opts = {}) {
  await page.goto(link.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: 'networkidle', ...opts });
  const seal = page.getByRole('button', { name: /Abrir mensaje de/ });
  await seal.click({ timeout: 15000 }).catch(() => {});
  await page.waitForSelector('[aria-label="Mensaje de Papá Noel"]', { state: 'detached', timeout: 5000 }).catch(() => {});
}

/** Fija abiertos los "Preparativos" del panel (se pliegan solos cuando el niño abre o escribe). */
async function pinSetup(page) {
  const t = page.getByRole('button', { name: /Preparativos/ });
  await t.waitFor({ timeout: 15000 });
  if ((await t.getAttribute('aria-expanded')) === 'true') await t.click();
  await t.click();
}

/** Enlace del móvil del niño en la pantalla de "sala creada" (ya no se muestra el enlace largo: va en un atributo). */
async function childLinkOf(page, i = 0) {
  const el = page.locator('[data-child-link]').nth(i);
  await el.waitFor({ timeout: 15000 });
  return (await el.getAttribute('data-child-link')).trim();
}

/** Enlace de familia en la pantalla de "sala creada". */
async function familyLinkOf(page) {
  const el = page.locator('[data-family-link]').first();
  await el.waitFor({ timeout: 15000 });
  return (await el.getAttribute('data-family-link')).trim();
}

module.exports = { BASE, OUT, FIX, launch, ensureFixtures, openChild, pinSetup, childLinkOf, familyLinkOf };
