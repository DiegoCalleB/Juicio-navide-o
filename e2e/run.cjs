#!/usr/bin/env node
/**
 * Lanzador de pruebas E2E: arranca la app con el almacén en memoria (sin Supabase),
 * ejecuta las pruebas de navegador una a una y apaga el servidor.
 *
 *   npm run test:e2e              → todas menos voz real
 *   npm run test:e2e -- landing   → solo las que coincidan con "landing"
 *   npm run test:e2e -- --voice   → incluye la prueba de voz (gasta créditos de ElevenLabs)
 *   npm run test:e2e -- --billing → prueba gratis y Pase de Navidad (Stripe simulado, servidor aparte)
 *   npm run test:e2e -- --now=2026-11-28T12:00:00+01:00 → campaña y precios según una fecha simulada
 */
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const withVoice = args.includes('--voice');
const withBilling = args.includes('--billing');
const nowArg = args.find((a) => a.startsWith('--now='))?.slice(6);
const filters = args.filter((a) => !a.startsWith('--'));
const PORT = Number(process.env.E2E_PORT || 3800);
const BASE = `http://localhost:${PORT}`;

const SPECS = ['landing', 'audio', 'surprise', 'video', 'polish', 'presence', 'caps', 'erase', 'edit', 'raton', 'duende', 'rooms', 'link', 'family', 'ideas', 'pwa', 'pin', 'locale', 'media', 'plan', 'phase1', ...(withVoice ? ['voice'] : [])];
const selected = nowArg ? ['blackfriday'] : withBilling ? ['billing'] : SPECS.filter((s) => filters.length === 0 || filters.some((f) => s.includes(f)));

const env = {
  ...process.env,
  // Fecha fija para que la portada de temporada y los precios sean predecibles (18-dic: Papá Noel, precio normal).
  FAKE_NOW: nowArg || '2026-12-18T12:00:00+01:00',
  ROOMS_STORE: 'memory',
  CRON_SECRET: 'testsecret-testsecret-1234',
  FINGERPRINT_SALT: process.env.FINGERPRINT_SALT || 'e2e-salt-e2e-salt-e2e-salt',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'e2e-anon-key-e2e-anon-key',
  NEXT_PUBLIC_CONTACT_EMAIL: 'hola@ejemplo.com',
  E2E_BASE: BASE,
  NEXT_DIST_DIR: '.next-e2e',
  ...(nowArg ? { STRIPE_FAKE: '1', FAKE_NOW: nowArg, STRIPE_WEBHOOK_SECRET: 'whsec_e2e_test_secret_123456' } : {}),
  ...(withBilling ? { STRIPE_FAKE: '1', TRIAL_TEST_SECONDS: '45', STRIPE_WEBHOOK_SECRET: 'whsec_e2e_test_secret_123456' } : {}),
  ...(withVoice ? { NEXT_PUBLIC_ENABLE_VOICE: '1', VOICE_ROOM_DAILY_LIMIT: '2', NODE_USE_ENV_PROXY: '1' } : {}),
};

async function waitReady() {
  for (let i = 0; i < 90; i++) {
    try {
      const r = await fetch(BASE + '/privacidad');
      if (r.ok) return;
    } catch { /* aún arrancando */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('El servidor no arrancó a tiempo');
}

(async () => {
  const server = spawn('npx', ['next', 'dev', '-p', String(PORT)], { env, stdio: 'ignore', detached: true, cwd: path.join(__dirname, '..') });
  const stop = () => { try { process.kill(-server.pid); } catch { /* ya parado */ } };
  process.on('exit', stop);
  process.on('SIGINT', () => { stop(); process.exit(130); });
  let failed = 0;
  try {
    await waitReady();
    await fetch(BASE + '/'); // calienta
    for (const name of selected) {
      process.stdout.write(`\n━━ ${name} ━━\n`);
      const r = spawnSync('node', [path.join(__dirname, 'specs', `${name}.cjs`)], { env, stdio: 'inherit', timeout: 600_000 });
      if (r.status !== 0) failed++;
    }
  } finally {
    stop();
  }
  console.log(failed ? `\n✗ ${failed} bloque(s) con fallos` : '\n✓ Todas las pruebas E2E pasan');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(2); });
