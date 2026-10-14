// Datos de prueba para recorrer la app con el teclado. Se puede correr
// muchas veces: lo que ya existe no se vuelve a crear.
import { ADMIN, API_URL, DRIVER } from "./config.mjs";

async function call(method, path, body, token, retried = false) {
  const res = await fetch(API_URL + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);

  // El backend permite 5 logins por minuto: si se corrió hace poco, esperar.
  if (res.status === 429 && !retried) {
    console.log("⏳ Límite de logins por minuto: esperando 60 segundos...");
    await new Promise((resolve) => setTimeout(resolve, 61_000));
    return call(method, path, body, token, true);
  }

  if (!res.ok) {
    const error = new Error(
      `${method} ${path}: ${res.status} ${JSON.stringify(data)}`,
    );
    error.status = res.status;
    throw error;
  }
  return data;
}

const list = (data) => (Array.isArray(data) ? data : (data?.data ?? []));

async function findOrCreate(token, path, match, body) {
  const existing = list(await call("GET", path, null, token)).find(match);
  return existing ?? call("POST", path, body, token);
}

export async function seed() {
  const { access_token: token } = await call("POST", "/auth/login", ADMIN);

  const customers = [];
  for (const [name, phone, address] of [
    ["Carnicería Centro", "3415556789", "San Martín 123"],
    ["Restaurante El Asador", "3415550001", "Pellegrini 456"],
    ["Parrilla Don Juan", "3415550002", "Oroño 789"],
  ]) {
    customers.push(
      await findOrCreate(token, "/customers", (c) => c.name === name, {
        name,
        phone,
        address,
        notes: "Tocar timbre",
      }),
    );
  }

  await findOrCreate(token, "/categories", (c) => c.name === "Achuras", {
    name: "Achuras",
  });

  const products = [];
  for (const [name, salePrice] of [
    ["Chinchulín", 1000],
    ["Molleja", 2500],
    ["Riñón", 800],
  ]) {
    products.push(
      await findOrCreate(token, "/products", (p) => p.name === name, {
        name,
        category: "Achuras",
        unit: "kg",
        salePrice,
        costPrice: salePrice / 2,
      }),
    );
  }

  // Repartidor con acceso a la app y una empleada sin acceso (para probar
  // el diálogo de "Crear acceso").
  const driver = await findOrCreate(
    token,
    "/employees",
    (e) => e.name === "Juan Repartidor",
    {
      name: "Juan Repartidor",
      position: "delivery",
      salary: 0,
      phone: "3415559999",
    },
  );
  let driverUserId = driver.account?.userId;
  if (!driverUserId) {
    driverUserId = (
      await call(
        "POST",
        `/employees/${driver.id}/account`,
        { ...DRIVER, role: "reparto" },
        token,
      )
    ).userId;
  }
  await findOrCreate(token, "/employees", (e) => e.name === "Ana Ventas", {
    name: "Ana Ventas",
    position: "sales",
    salary: 0,
  });

  // Notas de pedido de hoy para el repartidor (cada corrida entrega una).
  const today = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
  for (const customer of customers.slice(0, 2)) {
    await call(
      "POST",
      "/orders",
      {
        customerId: customer.id,
        items: [
          { productId: products[0].id, quantity: 3 },
          { productId: products[1].id, quantity: 1 },
        ],
        assignedToId: driverUserId,
        deliveryDate: today,
      },
      token,
    );
  }

  // Precios especiales del primer cliente: chinchulín sí, riñón no (la
  // verificación lo agrega y lo quita).
  await call(
    "PUT",
    `/customers/${customers[0].id}/prices/${products[0].id}`,
    { price: 900 },
    token,
  );
  await call(
    "DELETE",
    `/customers/${customers[0].id}/prices/${products[2].id}`,
    null,
    token,
  ).catch((error) => {
    if (error.status !== 404) throw error;
  });

  await findOrCreate(
    token,
    "/suppliers",
    (s) => s.name === "Frigorífico Norte",
    {
      name: "Frigorífico Norte",
      phone: "3415551234",
      email: "norte@test.com",
    },
  );
  await findOrCreate(token, "/expenses", (e) => e.description === "Nafta", {
    category: "fuel",
    description: "Nafta",
    amount: 3000,
    paymentMethod: "cash",
  });
}

// Inicia sesión una vez por la API y guarda el estado del navegador, para
// que las verificaciones no repitan el login (el backend permite 5 por minuto).
export async function saveSession(browser, { email, password }, file, appUrl) {
  const { access_token, user } = await call("POST", "/auth/login", {
    email,
    password,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${appUrl}/login`);
  await page.evaluate(
    ([token, u]) => {
      localStorage.setItem("access_token", token);
      localStorage.setItem("user", JSON.stringify(u));
      localStorage.setItem("last_activity", String(Date.now()));
    },
    [access_token, user],
  );
  await context.storageState({ path: file });
  await context.close();
}
