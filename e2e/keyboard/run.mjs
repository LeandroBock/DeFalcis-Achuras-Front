// Verificación de uso con teclado: levanta el frontend, carga datos de prueba
// en un backend LOCAL y recorre la app solo con el teclado en Chrome.
//
//   npm run test:keyboard
//
// Ver e2e/keyboard/README.md para preparar el backend de prueba.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

import {
  ADMIN,
  ADMIN_STATE,
  API_URL,
  APP_PORT,
  APP_URL,
  AUTH_DIR,
  DRIVER,
  DRIVER_STATE,
  assertLocalBackend,
  createReporter,
  launchBrowser,
} from "./config.mjs";
import { saveSession, seed } from "./seed.mjs";
import { runAudit } from "./audit.mjs";
import { runFlows } from "./flows.mjs";
import { runMobile } from "./mobile.mjs";

async function waitFor(url, label, seconds = 30) {
  for (let i = 0; i < seconds; i++) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`No responde ${label} (${url})`);
}

assertLocalBackend();

try {
  await waitFor(`${API_URL}/auth/login`, "el backend", 3);
} catch {
  console.error(
    `❌ No hay un backend de prueba en ${API_URL}.\n` +
      "   Levantalo como dice e2e/keyboard/README.md y volvé a correr.",
  );
  process.exit(1);
}

console.log("Cargando datos de prueba...");
await seed();

console.log("Levantando el frontend...");
const vite = spawn(
  "npx",
  ["vite", "--port", String(APP_PORT), "--strictPort"],
  {
    env: { ...process.env, VITE_API_URL: API_URL },
    stdio: "ignore",
    detached: true,
  },
);

let failures = 0;
const browser = await launchBrowser();

try {
  await waitFor(APP_URL, "el frontend");

  mkdirSync(AUTH_DIR, { recursive: true });
  await saveSession(browser, ADMIN, ADMIN_STATE, APP_URL);
  await saveSession(browser, DRIVER, DRIVER_STATE, APP_URL);

  for (const [title, run] of [
    ["Pantalla por pantalla", runAudit],
    ["Flujos completos", runFlows],
    ["Celular", runMobile],
  ]) {
    console.log(`\n── ${title} ──`);
    const report = createReporter();
    await run(browser, report);
    failures += report.failures;
  }
} finally {
  await browser.close();
  process.kill(-vite.pid);
}

console.log(
  failures
    ? `\n❌ ${failures} problema(s)`
    : "\n✅ Todo se puede usar con el teclado",
);
process.exit(failures ? 1 : 0);
