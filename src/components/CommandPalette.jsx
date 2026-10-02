import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  CreditCard,
  DollarSign,
  FileText,
  LayoutDashboard,
  Package,
  Receipt,
  Search,
  ShoppingCart,
  Tags,
  Truck,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";

const commands = [
  {
    label: "Dashboard",
    description: "Panel principal",
    path: "/dashboard",
    keywords: ["inicio", "principal", "dashboard"],
    icon: LayoutDashboard,
  },
  {
    label: "Productos",
    description: "Gestionar productos",
    path: "/products",
    keywords: ["productos", "articulos", "mercaderia"],
    icon: Package,
  },
  {
    label: "Inventario",
    description: "Stock y movimientos",
    path: "/inventory",
    keywords: ["inventario", "stock", "movimientos", "mercaderia"],
    icon: Boxes,
  },
  {
    label: "Categorías",
    description: "Gestionar categorías",
    path: "/categories",
    keywords: ["categorias", "categoría"],
    icon: Tags,
  },
  {
    label: "Clientes",
    description: "Gestionar clientes",
    path: "/customers",
    keywords: ["clientes", "cliente"],
    icon: Users,
  },
  {
    label: "Proveedores",
    description: "Gestionar proveedores",
    path: "/suppliers",
    keywords: ["proveedores", "proveedor"],
    icon: Truck,
  },
  {
    label: "Compras",
    description: "Gestionar compras",
    path: "/purchases",
    keywords: ["compras", "compra"],
    icon: ShoppingCart,
  },
  {
    label: "Cuentas por pagar",
    description: "Consultar deudas con proveedores",
    path: "/payables",
    keywords: ["pagar", "pagos", "proveedores", "deudas"],
    icon: Wallet,
  },
  {
    label: "Pagos a proveedores",
    description: "Registrar pagos",
    path: "/supplier-payments",
    keywords: ["pagos", "proveedores"],
    icon: CreditCard,
  },
  {
    label: "Ventas",
    description: "Gestionar ventas",
    path: "/orders",
    keywords: ["ventas", "venta", "pedidos", "pedido"],
    icon: Receipt,
  },
  {
    label: "Cuentas por cobrar",
    description: "Consultar saldos de clientes",
    path: "/receivables",
    keywords: ["cobrar", "clientes", "deudas", "saldos"],
    icon: DollarSign,
  },
  {
    label: "Pagos",
    description: "Gestionar pagos",
    path: "/payments",
    keywords: ["pagos", "pago"],
    icon: CreditCard,
  },
  {
    label: "Gastos",
    description: "Gestionar gastos",
    path: "/expenses",
    keywords: ["gastos", "gasto"],
    icon: FileText,
  },
  {
    label: "Empleados",
    description: "Gestionar empleados",
    path: "/employees",
    keywords: ["empleados", "empleado", "personal"],
    icon: UserRound,
  },
  {
    label: "Reportes",
    description: "Consultar reportes",
    path: "/reports",
    keywords: ["reportes", "reporte", "informes"],
    icon: BarChart3,
  },
  {
    label: "WhatsApp",
    description: "Gestionar WhatsApp",
    path: "/whatsapp",
    keywords: ["whatsapp", "mensajes"],
    icon: FileText,
  },
];

function CommandPalette() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);

  useEffect(() => {
    function handleShortcut(event) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");

      const modifierPressed = isMac
        ? event.metaKey
        : event.ctrlKey;

      if (modifierPressed && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedIndex(0);
      return;
    }

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [open]);

  const filteredCommands = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return commands;
    }

    return commands.filter((command) => {
      const content = [
        command.label,
        command.description,
        ...command.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return content.includes(normalizedSearch);
    });
  }, [search]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  function close() {
    setOpen(false);
  }

  function executeCommand(command) {
    close();
    navigate(command.path);
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      setSelectedIndex((current) =>
        Math.min(current + 1, filteredCommands.length - 1),
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setSelectedIndex((current) =>
        Math.max(current - 1, 0),
      );

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const command = filteredCommands[selectedIndex];

      if (command) {
        executeCommand(command);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        role="dialog"
        aria-modal="true"
        aria-label="Navegación rápida"
      >
        {/* BUSCADOR */}

        <div className="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-800">
          <Search className="h-5 w-5 shrink-0 text-gray-400" />

          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="¿A dónde querés ir?"
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
            aria-label="Buscar sección"
            autoComplete="off"
          />

          <button
            type="button"
            onClick={close}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* RESULTADOS */}

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-700" />

              <p className="font-medium text-gray-700 dark:text-gray-300">
                No encontramos resultados
              </p>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Probá con otro término.
              </p>
            </div>
          ) : (
            filteredCommands.map((command, index) => {
              const Icon = command.icon;
              const selected = index === selectedIndex;

              return (
                <button
                  key={command.path}
                  type="button"
                  onClick={() => executeCommand(command)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    selected
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      selected
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {command.label}
                    </p>

                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {command.description}
                    </p>
                  </div>

                  {selected && (
                    <kbd className="hidden rounded border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-500 sm:block dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                      Enter
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* AYUDA */}

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <div className="flex gap-4">
            <span>
              <kbd className="mr-1 rounded border border-gray-300 px-1.5 py-0.5 dark:border-gray-700">
                ↑
              </kbd>
              <kbd className="rounded border border-gray-300 px-1.5 py-0.5 dark:border-gray-700">
                ↓
              </kbd>{" "}
              navegar
            </span>

            <span>
              <kbd className="rounded border border-gray-300 px-1.5 py-0.5 dark:border-gray-700">
                Enter
              </kbd>{" "}
              abrir
            </span>
          </div>

          <span>
            <kbd className="rounded border border-gray-300 px-1.5 py-0.5 dark:border-gray-700">
              Esc
            </kbd>{" "}
            cerrar
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
