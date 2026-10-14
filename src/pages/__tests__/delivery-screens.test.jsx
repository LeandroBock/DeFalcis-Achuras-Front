import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";

import DeliveryForm from "../../components/delivery/DeliveryForm";
import { AuthProvider } from "../../context/AuthContext";
import { keys } from "../../hooks/queries";
import { todayISO } from "../../utils/format";
import Deliveries from "../Deliveries";
import LiveDeliveries from "../LiveDeliveries";
import Orders from "../Orders";
import Settlement from "../Settlement";

// Se renderizan las pantallas a HTML con datos de ejemplo en la caché, para
// detectar errores al dibujarlas (datos faltantes, campos mal leídos, etc.).

const products = [
  {
    id: "p1",
    name: "Chinchulín",
    unit: "kg",
    salePrice: "1000.00",
    stock: "-2.5",
  },
  { id: "p2", name: "Molleja", unit: "kg", salePrice: "2500.00", stock: "10" },
];

const note = {
  id: "o1",
  status: "pending",
  total: 7500,
  notes: "Tocar timbre",
  deliveryDate: todayISO(),
  customer: {
    id: "c1",
    name: "Carnicería Centro",
    address: "San Martín 123",
    phone: "3415556789",
  },
  items: [
    {
      productId: "p1",
      productName: "Chinchulín",
      unit: "kg",
      requestedQuantity: 5,
      quantity: 5,
      unitPrice: 1000,
      subtotal: 5000,
    },
    {
      productId: "p2",
      productName: "Molleja",
      unit: "kg",
      requestedQuantity: 1,
      quantity: 1,
      unitPrice: 2500,
      subtotal: 2500,
    },
  ],
};

// Token con forma de JWT y sin vencimiento, para que AuthProvider tome la
// sesión como vigente.
const fakeToken = (payload) =>
  `x.${btoa(JSON.stringify(payload)).replace(/=+$/, "")}.y`;

function storeSession(user) {
  const storage = new Map([
    ["access_token", fakeToken({ sub: user.id })],
    ["user", JSON.stringify(user)],
  ]);
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
}

function render(element, seed = {}) {
  const queryClient = new QueryClient();
  for (const [key, data] of Object.entries(seed)) {
    queryClient.setQueryData(JSON.parse(key), data);
  }

  return renderToString(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>{element}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const seedKey = (key) => JSON.stringify(key);

describe("pantallas de reparto", () => {
  beforeEach(() =>
    storeSession({ id: "u1", name: "Repartidor Uno", role: "reparto" }),
  );

  it("formulario de entrega: kilos pedidos, precios y total", () => {
    const html = render(
      <DeliveryForm
        order={note}
        products={products}
        onDone={() => {}}
        onClose={() => {}}
      />,
    );

    expect(html).toContain("Carnicería Centro");
    expect(html).toContain("Chinchulín");
    expect(html).toContain("Pedido: 5 kg");
    expect(html).toContain("Confirmar entrega");
    expect(html).toContain("No entregado");
    // Total con los kilos pedidos: 5 × 1000 + 1 × 2500
    expect(html).toMatch(/7\.500,00/);
  });

  it("mis entregas: tarjeta con dirección, contacto y productos", () => {
    const html = render(<Deliveries />, {
      [seedKey(keys.myDeliveries(todayISO()))]: [note],
      [seedKey(keys.products)]: products,
    });

    expect(html).toContain("Mis entregas");
    expect(html).toContain("1 nota para entregar");
    expect(html).toContain("San Martín 123");
    expect(html).toContain("https://wa.me/5493415556789");
    expect(html).toContain("Cargar entrega");
  });

  it("mi rendición: lo cobrado por método y los kilos", () => {
    const html = render(<Settlement />, {
      [seedKey(keys.settlement("u1", todayISO()))]: {
        driver: { id: "u1", name: "Repartidor Uno" },
        date: todayISO(),
        deliveredCount: 2,
        stillPendingCount: 1,
        totalSold: 8300,
        totalCollected: 5800,
        totalOnCredit: 2500,
        collectedByMethod: { cash: 4000, transfer: 1800 },
        products: [
          {
            productId: "p1",
            name: "Chinchulín",
            unit: "kg",
            requested: 7,
            delivered: 6.8,
            amount: 6800,
          },
        ],
        orders: [
          {
            id: "o1",
            customer: { name: "Carnicería Centro" },
            total: 4800,
            collected: 4800,
            deliveredAt: new Date().toISOString(),
            deliveryComment: null,
          },
        ],
      },
    });

    expect(html).toContain("Mi rendición");
    expect(html).toMatch(/4\.000,00/); // efectivo
    expect(html).toMatch(/1\.800,00/); // transferencia
    expect(html).toContain("6,8 kg");
    expect(html).toContain("todavía sin entregar");
  });
});

describe("pedidos y ventas (oficina)", () => {
  beforeEach(() => storeSession({ id: "u2", name: "Oficina", role: "ventas" }));

  it("lista las notas pendientes con repartidor y acciones", () => {
    const html = render(<Orders />, {
      [seedKey(keys.orders)]: [
        {
          id: "o1",
          customerId: "c1",
          status: "pending",
          paymentStatus: "pending",
          total: "7500.00",
          assignedToId: "u1",
          deliveryDate: todayISO(),
          deliveryComment: "No había nadie",
          createdAt: new Date().toISOString(),
        },
        {
          id: "o2",
          customerId: "c1",
          status: "delivered",
          paymentStatus: "partial",
          total: "4800.00",
          deliveredById: "u1",
          deliveredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
      [seedKey(keys.customers)]: [{ id: "c1", name: "Carnicería Centro" }],
      [seedKey(keys.products)]: products,
      [seedKey(keys.drivers)]: [{ id: "u1", name: "Repartidor Uno" }],
      [seedKey(keys.invoices)]: [],
    });

    expect(html).toContain("Pedidos y ventas");
    expect(html).toContain("Pendientes<!-- --> (<!-- -->1<!-- -->)");
    expect(html).toContain("Repartidor Uno");
    expect(html).toContain("No entregada: <!-- -->No había nadie");
    expect(html).toContain("Cargar entrega");
    expect(html).toContain("Nota pendiente");
  });

  it("reparto en vivo: columnas por repartidor y estados", () => {
    const html = render(<LiveDeliveries />, {
      [seedKey(keys.deliveryBoard(todayISO()))]: {
        date: todayISO(),
        summary: {
          total: 3,
          pending: 1,
          delivered: 1,
          notDelivered: 1,
          sold: 4800,
          collected: 4000,
        },
        notes: [
          {
            ...note,
            boardStatus: "pending",
            driverId: "u1",
            driverName: "Repartidor Uno",
            collected: 0,
          },
          {
            ...note,
            id: "o2",
            boardStatus: "delivered",
            driverId: "u1",
            driverName: "Repartidor Uno",
            total: 4800,
            collected: 4000,
            deliveredAt: new Date().toISOString(),
            items: [{ ...note.items[0], quantity: 4.8 }],
          },
          {
            ...note,
            id: "o3",
            boardStatus: "not_delivered",
            driverId: null,
            driverName: "Repartidor Uno",
            deliveryComment: "Cerrado",
            collected: 0,
          },
        ],
      },
    });

    expect(html).toContain("Reparto en vivo");
    expect(html).toContain("Repartidor Uno");
    expect(html).toContain("1<!-- -->/<!-- -->2<!-- --> entregadas");
    expect(html).toContain("Volvieron a la oficina");
    expect(html).toContain("Motivo: <!-- -->Cerrado");
    expect(html).toContain("4,8 kg");
  });
});
