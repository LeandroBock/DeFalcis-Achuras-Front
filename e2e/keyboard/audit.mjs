// Recorre cada pantalla con Tab (y con el formulario de alta abierto) y
// verifica que se llegue a todos los elementos interactivos y que el foco
// siempre se vea.
import { ADMIN_STATE, openPage } from "./config.mjs";

const PAGES = [
  "/dashboard",
  "/products",
  "/inventory",
  "/categories",
  "/customers",
  "/suppliers",
  "/purchases",
  "/orders",
  "/live-deliveries",
  "/settlement",
  "/payments",
  "/expenses",
  "/employees",
  "/reports",
  "/receivables",
  "/supplier-payments",
  "/payables",
  "/whatsapp",
];

// Marca los elementos interactivos visibles de la pantalla.
const tagInteractive = (page) =>
  page.evaluate(() => {
    document
      .querySelectorAll("[data-kbd]")
      .forEach((el) => delete el.dataset.kbd);

    const selector =
      "a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex]";
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return (
        r.width > 0 &&
        r.height > 0 &&
        s.visibility !== "hidden" &&
        s.display !== "none"
      );
    };

    return [...document.querySelectorAll(selector)]
      .filter((el) => visible(el) && !el.disabled)
      .map((el, i) => {
        el.dataset.kbd = String(i);
        return {
          id: String(i),
          tag: el.tagName.toLowerCase(),
          // Fuera del Tab por diseño: el destino de "Saltar al contenido"
          // (<main>) y las tablas que se recorren con flechas (una sola
          // parada de Tab por tabla, con atajos en la fila).
          byDesign:
            el.tagName === "MAIN" || !!el.closest("tr[aria-keyshortcuts]"),
          label: (
            el.getAttribute("aria-label") ||
            el.textContent ||
            el.getAttribute("placeholder") ||
            ""
          )
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 50),
        };
      });
  });

const focused = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const s = getComputedStyle(el);
    return {
      id: el.dataset.kbd ?? null,
      label: `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40)}"`,
      visible:
        s.outlineStyle !== "none" &&
        parseFloat(s.outlineWidth) >= 2 &&
        !/rgba\([^)]*,\s*0\)|transparent/.test(s.outlineColor),
    };
  });

async function auditCurrent(page, name, report) {
  const items = await tagInteractive(page);
  const reached = new Set();
  const invisible = new Set();

  await page.evaluate(() => document.activeElement?.blur());
  let first = null;
  for (let i = 0; i < items.length * 2 + 40; i++) {
    await page.keyboard.press("Tab");
    // Esperar a que terminen las transiciones de foco (Tailwind: 150 ms).
    await page.waitForTimeout(220);
    const info = await focused(page);
    if (!info) continue;
    const key = info.id ?? info.label;
    if (key === first && reached.size > 1) break;
    first ??= key;
    if (info.id) reached.add(info.id);
    if (!info.visible) invisible.add(info.label);
  }

  const unreachable = items.filter(
    (item) => !item.byDesign && !reached.has(item.id),
  );
  report.check(
    `${name}: se llega a todo con Tab y el foco se ve`,
    unreachable.length === 0 && invisible.size === 0,
    [
      ...unreachable.map((u) => `sin Tab: ${u.tag} "${u.label}"`),
      ...[...invisible].map((label) => `foco invisible: ${label}`),
    ].join("; "),
  );
}

export async function runAudit(browser, report) {
  const page = await openPage(browser, ADMIN_STATE, "/dashboard");

  for (const path of PAGES) {
    await page.goto(new URL(path, page.url()).href);
    await page.waitForLoadState("load");
    await page.waitForTimeout(1500);
    await auditCurrent(page, path, report);

    // Con el formulario de alta abierto (con Enter, no con clic).
    const opener = page
      .locator("main button", { hasText: /^\s*(Nuev[oa]|Registrar)\b/ })
      .first();
    if (await opener.count()) {
      const label = (await opener.innerText()).trim();
      await opener.focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(600);
      await auditCurrent(page, `${path} con "${label}" abierto`, report);
    }
  }

  await page.context().close();
}
