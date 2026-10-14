// Configuración común de la verificación con teclado.
import { chromium } from "playwright-core";

export const API_URL = process.env.KEYBOARD_API_URL ?? "http://localhost:3995";
export const APP_PORT = Number(process.env.KEYBOARD_APP_PORT ?? 5179);
export const APP_URL = `http://localhost:${APP_PORT}`;

// Usuario super admin del backend de prueba (el backend lo crea al arrancar
// con SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD).
export const ADMIN = {
  email: process.env.KEYBOARD_ADMIN_EMAIL ?? "admin@test.com",
  password: process.env.KEYBOARD_ADMIN_PASSWORD ?? "Admin12345678",
};
export const DRIVER = { email: "reparto@test.com", password: "Reparto12345" };

export const AUTH_DIR = new URL("./.auth/", import.meta.url).pathname;
export const ADMIN_STATE = `${AUTH_DIR}admin.json`;
export const DRIVER_STATE = `${AUTH_DIR}reparto.json`;

// Los datos de prueba se cargan en el backend: nunca contra uno remoto
// (por ejemplo, el de producción en Render).
export function assertLocalBackend() {
  const { hostname } = new URL(API_URL);
  if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
    throw new Error(
      `La verificación con teclado solo corre contra un backend local (KEYBOARD_API_URL=${API_URL}).`,
    );
  }
}

// Google Chrome instalado en la máquina (no hace falta descargar navegadores).
// Se puede indicar otro con CHROME_PATH.
export function launchBrowser() {
  return chromium.launch({
    headless: process.env.HEADED !== "1",
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : { channel: "chrome" }),
  });
}

// Reporte de resultados: ✅ / ❌ por chequeo.
export function createReporter() {
  let failures = 0;
  return {
    check(label, ok, detail = "") {
      if (!ok) failures++;
      console.log(
        `${ok ? "✅" : "❌"} ${label}${detail ? ` — ${detail}` : ""}`,
      );
    },
    get failures() {
      return failures;
    },
  };
}

// Elemento con el foco y si está adentro de un modal.
export const activeElement = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    const style = el ? getComputedStyle(el) : null;
    return {
      tag: el?.tagName.toLowerCase(),
      id: el?.id,
      text: (
        el?.getAttribute("aria-label") ||
        el?.textContent ||
        el?.getAttribute("placeholder") ||
        ""
      )
        .trim()
        .replace(/\s+/g, " "),
      inDialog: !!el?.closest('[aria-modal="true"]'),
      dialogs: document.querySelectorAll('[aria-modal="true"]').length,
      // Contorno de foco real: sólido, de 2px o más y no transparente.
      focusVisible:
        !!style &&
        style.outlineStyle !== "none" &&
        parseFloat(style.outlineWidth) >= 2 &&
        !/rgba\([^)]*,\s*0\)|transparent/.test(style.outlineColor),
    };
  });

// Tab (o Shift+Tab) hasta que el foco cumpla la condición.
export async function tabTo(page, predicate, { back = false, max = 120 } = {}) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(back ? "Shift+Tab" : "Tab");
    const el = await activeElement(page);
    if (predicate(el)) return el;
  }
  throw new Error("No se llegó con Tab al elemento buscado");
}

export const byText = (text) => (el) => el.text.includes(text);

export async function openPage(browser, statePath, path, viewport) {
  const context = await browser.newContext({
    viewport: viewport ?? { width: 1366, height: 900 },
    storageState: statePath,
  });
  const page = await context.newPage();
  await page.goto(APP_URL + path);
  // La app mantiene abierto el canal de avisos: no hay "red inactiva".
  await page.waitForLoadState("load");
  await page.waitForTimeout(1500);
  return page;
}
