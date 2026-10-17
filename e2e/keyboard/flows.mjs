// Flujos completos usando SOLO el teclado: nunca se hace clic; se navega con
// Tab, Shift+Tab, flechas y atajos, y se activa con Enter.
import {
  ADMIN,
  ADMIN_STATE,
  APP_URL,
  DRIVER_STATE,
  activeElement as active,
  byText,
  openPage,
  tabTo,
} from "./config.mjs";

// Un modal abierto: el foco entra, Tab no se escapa, Esc cierra y el foco
// vuelve al botón que lo abrió.
async function checkModal(page, report, name, opener) {
  const first = await active(page);
  report.check(
    `${name}: el foco entra al abrir`,
    first.inDialog,
    `foco en <${first.tag}> "${first.text.slice(0, 30)}"`,
  );

  let escaped = null;
  for (let i = 0; i < 40 && !escaped; i++) {
    await page.keyboard.press(i % 7 === 6 ? "Shift+Tab" : "Tab");
    const el = await active(page);
    if (!el.inDialog) escaped = el;
  }
  report.check(
    `${name}: Tab y Shift+Tab no se escapan del modal`,
    !escaped,
    escaped ? `salió a "${escaped.text.slice(0, 30)}"` : "",
  );

  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  const after = await active(page);
  report.check(`${name}: Esc lo cierra`, after.dialogs < first.dialogs);
  report.check(
    `${name}: el foco vuelve a "${opener}"`,
    after.text.includes(opener),
    `foco en "${after.text.slice(0, 40)}"`,
  );
}

// Fila de una tabla recorrida con flechas: Tab entra a la tabla y las
// flechas bajan hasta la fila con ese texto.
async function rowWith(page, text) {
  let el = await tabTo(page, (e) => e.tag === "tr");
  for (let i = 0; i < 30 && !el.text.includes(text); i++) {
    await page.keyboard.press("ArrowDown");
    el = await active(page);
  }
  return el;
}

// Login: Tab hasta el email, escribir, Tab, contraseña, Enter.
async function login(browser, report) {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(`${APP_URL}/login`);
  await page.waitForSelector("#email");

  await tabTo(page, (e) => e.id === "email");
  await page.keyboard.type(ADMIN.email);
  await page.keyboard.press("Tab");
  await page.keyboard.type(ADMIN.password);
  await page.keyboard.press("Enter");
  await page
    .waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 10_000,
    })
    .catch(() => {});

  report.check(
    "Login solo con teclado (Tab, escribir, Enter)",
    !new URL(page.url()).pathname.startsWith("/login"),
    page.url(),
  );
  await context.close();
}

async function navigation(browser, report) {
  const page = await openPage(browser, ADMIN_STATE, "/dashboard");

  let el = await active(page);
  report.check(
    "Al entrar a una pantalla, el foco queda en el contenido",
    el.tag === "main",
    `<${el.tag}>`,
  );

  el = await tabTo(page, (e) => /saltar/i.test(e.text), { back: true });
  report.check(
    'Shift+Tab llega a "Saltar al contenido"',
    /saltar/i.test(el.text),
  );
  await page.keyboard.press("Enter");
  el = await active(page);
  report.check(
    'Enter en "Saltar al contenido" lleva el foco al contenido',
    el.tag === "main",
  );

  await tabTo(page, byText("Pedidos y ventas"), { back: true });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  report.check(
    "Menú: Shift+Tab hasta una sección + Enter navega",
    page.url().endsWith("/orders"),
    page.url(),
  );

  await page.keyboard.press("Control+k");
  await page.waitForTimeout(300);
  el = await active(page);
  report.check(
    "Ctrl+K abre la paleta con el foco en la búsqueda",
    el.tag === "input",
  );
  await page.keyboard.type("clientes");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  report.check(
    "Paleta: escribir + Enter navega",
    page.url().endsWith("/customers"),
  );

  await page.keyboard.press("Alt+8");
  await page.waitForTimeout(800);
  report.check("Alt+8 va a Pedidos y ventas", page.url().endsWith("/orders"));

  await page.context().close();
}

async function customers(browser, report) {
  let page = await openPage(browser, ADMIN_STATE, "/customers");
  let el = await tabTo(page, (e) => e.tag === "tr");
  report.check("Clientes: un Tab entra a la tabla", el.tag === "tr");
  const firstRow = el.text;
  await page.keyboard.press("ArrowDown");
  el = await active(page);
  report.check(
    "Clientes: flecha abajo pasa a la fila siguiente",
    el.tag === "tr" && el.text !== firstRow,
  );
  const row = el.text.slice(0, 15);

  await page.keyboard.press("p");
  await page.waitForTimeout(500);
  await checkModal(page, report, "Precios especiales (tecla P)", row);

  await page.keyboard.press("Delete");
  await page.waitForTimeout(300);
  el = await active(page);
  report.check(
    'Supr abre la confirmación con foco en "Cancelar"',
    el.text === "Cancelar",
  );
  await checkModal(page, report, "Confirmar desactivar", row);
  await page.context().close();

  // Precios especiales: agregar, editar (Esc cancela solo la edición), quitar.
  page = await openPage(browser, ADMIN_STATE, "/customers");
  await tabTo(page, (e) => e.tag === "tr");
  await page.keyboard.press("p");
  await page.waitForTimeout(500);
  await tabTo(page, (e) => e.tag === "select" && e.inDialog);
  await page.keyboard.type("Riñ");
  await page.keyboard.press("Tab");
  await page.keyboard.type("750");
  // Tipo: precio fijo (por defecto es % de descuento sobre la lista).
  await page.keyboard.press("Tab");
  await page.keyboard.type("$");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  el = await active(page);
  report.check(
    "Precios: agregado con Enter y el foco vuelve al selector",
    el.tag === "select" && el.inDialog,
  );

  await tabTo(page, byText("Editar precio de Riñón"), { back: true });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  el = await active(page);
  report.check(
    "Precios: Editar pone el foco en el importe",
    el.tag === "input",
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  el = await active(page);
  report.check(
    "Precios: Esc cancela solo la edición (el diálogo sigue abierto)",
    el.dialogs === 1 && el.text.includes("Editar precio de Riñón"),
  );

  await page.keyboard.press("Enter");
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("700");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  el = await active(page);
  report.check(
    'Precios: guardar con Enter devuelve el foco a "Editar"',
    el.text.includes("Editar precio de Riñón"),
  );

  await tabTo(page, byText("Quitar precio especial de Riñón"));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  el = await active(page);
  report.check(
    "Precios: quitar con Enter deja el foco en el selector",
    el.tag === "select" && el.inDialog,
  );
  await page.context().close();

  page = await openPage(browser, ADMIN_STATE, "/customers");
  await tabTo(page, (e) => e.tag === "tr");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  el = await active(page);
  report.check(
    "Enter en la fila abre la edición con foco en el formulario",
    el.tag === "input",
  );
  await page.context().close();
}

async function orders(browser, report) {
  const page = await openPage(browser, ADMIN_STATE, "/orders");
  await tabTo(page, byText("Nueva nota de pedido"));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);

  await tabTo(page, (e) => e.id === "customer");
  await page.keyboard.type("Parr"); // se elige escribiendo: "Parrilla Don Juan"
  const customer = await page.evaluate(
    () => document.getElementById("customer").selectedOptions[0]?.textContent,
  );
  report.check(
    "Nota: el cliente se elige escribiendo en el selector",
    /Parrilla/.test(customer ?? ""),
  );

  await tabTo(page, (e) => e.id === "product");
  await page.keyboard.type("Moll");
  await tabTo(page, (e) => e.id === "quantity");
  await page.keyboard.type("2.5");
  await tabTo(page, byText("Agregar"));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  report.check(
    "Nota: producto agregado con Enter",
    (await page.locator("table >> text=Molleja").count()) > 0,
  );

  await tabTo(page, byText("Guardar nota de pedido"));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  report.check(
    "Nota de pedido guardada solo con teclado",
    (await page.locator("text=Nota de pedido creada").count()) > 0,
  );

  let el = await active(page);
  report.check(
    'Nota guardada: el foco vuelve a "Nueva nota de pedido"',
    el.text.includes("Nueva nota de pedido"),
    `foco en "${el.text.slice(0, 40)}"`,
  );

  el = await rowWith(page, "Parrilla Don Juan");
  report.check("Pedidos: flechas hasta la nota nueva", el.tag === "tr");
  await page.keyboard.press("a");
  await page.waitForTimeout(400);
  await checkModal(page, report, "Asignar reparto (tecla A)", "Parrilla");

  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  el = await active(page);
  report.check(
    "Entrega (Enter en la fila): el foco arranca en los kilos",
    el.tag === "input" && /kilos|unidades/i.test(el.text),
  );

  await tabTo(page, byText("No entregado"));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  el = await active(page);
  report.check(
    "No entregado: modal anidado con foco en el motivo",
    el.inDialog && el.tag === "input",
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  el = await active(page);
  report.check(
    'Esc cierra solo el modal de arriba y el foco vuelve a "No entregado"',
    el.dialogs === 1 && el.text.includes("No entregado"),
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  el = await active(page);
  report.check(
    "Esc cierra la entrega y el foco vuelve a la fila",
    el.dialogs === 0 && el.tag === "tr" && el.text.includes("Parrilla"),
  );
  await page.context().close();
}

async function employees(browser, report) {
  const page = await openPage(browser, ADMIN_STATE, "/employees");
  await rowWith(page, "Ana Ventas");
  await page.keyboard.press("a");
  await page.waitForTimeout(400);
  await checkModal(page, report, "Acceso a la app (tecla A)", "Ana Ventas");
  await page.context().close();
}

async function driver(browser, report) {
  const page = await openPage(browser, DRIVER_STATE, "/deliveries");
  report.check(
    'Repartidor entra a "Mis entregas"',
    page.url().endsWith("/deliveries"),
  );

  const before = await page.locator("text=Cargar entrega").count();
  await tabTo(page, byText("Cargar entrega"));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("2.85"); // kilos pesados del primer producto
  await tabTo(page, byText("Efectivo"));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  // El importe se precarga con lo pendiente: se cambia por un pago parcial.
  await tabTo(page, (e) => e.tag === "input" && /importe/i.test(e.text), {
    back: true,
  });
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("2000");
  await tabTo(page, byText("Confirmar entrega"));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500);

  const done = await page.locator("text=Entrega registrada").count();
  const after = await page.locator("text=Cargar entrega").count();
  report.check(
    "Repartidor: entrega cargada y confirmada solo con teclado",
    done > 0 && after === before - 1,
    `notas: ${before} → ${after}`,
  );
  await page.context().close();
}

// Después de la entrega del repartidor (que deja saldo): la cuenta corriente
// del cliente y el pago desde la oficina.
async function currentAccounts(browser, report) {
  const page = await openPage(browser, ADMIN_STATE, "/current-accounts");
  const el = await tabTo(page, (e) => e.tag === "tr");
  report.check("Cuentas corrientes: un Tab entra a la tabla", el.tag === "tr");
  const opener = el.text.slice(0, 15);

  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  const first = await active(page);
  report.check(
    "Cuenta corriente: el foco arranca en el monto del pago",
    first.tag === "input" && first.inDialog,
  );
  await checkModal(page, report, "Cuenta corriente", opener);
  await page.context().close();
}

// Facturar: elegir una venta entregada y abrir la ventana de revisión.
async function invoicing(browser, report) {
  const page = await openPage(browser, ADMIN_STATE, "/orders");
  await tabTo(page, byText("Entregadas"));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);

  const row = await tabTo(page, (e) => e.tag === "tr");
  await page.keyboard.press("Space");
  const checked = await page.evaluate(
    () => document.activeElement.querySelector("input[type=checkbox]")?.checked,
  );
  report.check("Facturar: Espacio elige la venta de la fila", checked === true);
  await page.keyboard.press("Space");

  await page.keyboard.press("f");
  await page.waitForTimeout(1500);

  const el = await active(page);
  report.check(
    "Facturar: la ventana de revisión abre con el foco en el nombre del cliente",
    el.inDialog && el.tag === "input",
    `<${el.tag}> en diálogo: ${el.inDialog}`,
  );
  report.check(
    "Facturar: muestra la vista previa y el botón para emitir",
    (await page.locator("text=Descargar vista previa (PDF)").count()) > 0 &&
      (await page.locator("button", { hasText: /Emitir factura/ }).count()) > 0,
  );
  await checkModal(
    page,
    report,
    "Ventana de facturación (tecla F)",
    row.text.slice(0, 15),
  );
  await page.context().close();
}

// Pantallas con formulario (como Clientes): N abre el alta con el foco en el
// primer campo, Esc la cierra y el foco vuelve; Enter en una fila edita.
async function crudShortcuts(browser, report) {
  for (const [path, newLabel, rowText] of [
    ["/products", "Nuevo producto", "Molleja"],
    ["/suppliers", "Nuevo proveedor", "Frigorífico Norte"],
    ["/expenses", "Nuevo gasto", "Nafta"],
  ]) {
    const page = await openPage(browser, ADMIN_STATE, path);

    await page.keyboard.press("n");
    await page.waitForTimeout(400);
    let el = await active(page);
    report.check(
      `${path}: N abre el formulario con el foco en el primer campo`,
      ["input", "select"].includes(el.tag),
      `<${el.tag}>`,
    );
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    el = await active(page);
    report.check(
      `${path}: Esc cierra el formulario y el foco vuelve a "${newLabel}"`,
      el.text.includes(newLabel),
      `foco en "${el.text.slice(0, 40)}"`,
    );

    el = await rowWith(page, rowText);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    const value = await page.evaluate(() => document.activeElement.value);
    report.check(
      `${path}: Enter en la fila abre la edición con sus datos`,
      typeof value === "string" && value.length > 0,
    );
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    el = await active(page);
    report.check(
      `${path}: Esc vuelve a la fila`,
      el.tag === "tr" && el.text.includes(rowText),
    );
    await page.context().close();
  }
}

export async function runFlows(browser, report) {
  for (const flow of [
    login,
    navigation,
    customers,
    crudShortcuts,
    orders,
    employees,
    driver,
    currentAccounts,
    invoicing,
  ]) {
    try {
      await flow(browser, report);
    } catch (error) {
      report.check(`Flujo "${flow.name}"`, false, error.message);
    }
  }
}
