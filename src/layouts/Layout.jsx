import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  CreditCard,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  ShoppingCart,
  Tags,
  Truck,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import CommandPalette from "../components/CommandPalette";

const navigationItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    shortcut: "Alt + 1",
    icon: LayoutDashboard,
  },
  {
    to: "/products",
    label: "Productos",
    shortcut: "Alt + 2",
    icon: Package,
  },
  {
    to: "/inventory",
    label: "Inventario",
    shortcut: "Alt + 3",
    icon: Boxes,
  },
  {
    to: "/categories",
    label: "Categorías",
    shortcut: "Alt + 4",
    icon: Tags,
  },
  {
    to: "/customers",
    label: "Clientes",
    shortcut: "Alt + 5",
    icon: Users,
  },
  {
    to: "/suppliers",
    label: "Proveedores",
    shortcut: "Alt + 6",
    icon: Truck,
  },
  {
    to: "/purchases",
    label: "Compras",
    shortcut: "Alt + 7",
    icon: ShoppingCart,
  },
  {
    to: "/orders",
    label: "Ventas",
    shortcut: "Alt + 8",
    icon: Receipt,
  },
  {
    to: "/payments",
    label: "Pagos",
    shortcut: "Alt + 9",
    icon: CreditCard,
  },
  {
    to: "/expenses",
    label: "Gastos",
    shortcut: "Alt + 0",
    icon: FileText,
  },
  {
    to: "/employees",
    label: "Empleados",
    icon: UserRound,
  },
  {
    to: "/reports",
    label: "Reportes",
    icon: BarChart3,
  },
  {
    to: "/receivables",
    label: "Cuentas por cobrar",
    icon: DollarSign,
  },
  {
    to: "/supplier-payments",
    label: "Pagos a proveedores",
    icon: CreditCard,
  },
  {
    to: "/payables",
    label: "Cuentas por pagar",
    icon: Wallet,
  },
  {
    to: "/whatsapp",
    label: "WhatsApp",
    icon: FileText,
  },
];

function Layout() {
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Referencias de todos los links del menú
  const linkRefs = useRef([]);

  // Mantiene los atajos de teclado existentes
  useKeyboardShortcuts();

  function handleMenuKeyDown(event, index) {
    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp"
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const direction =
      event.key === "ArrowDown" ? 1 : -1;

    let nextIndex = index + direction;

    // No salir de los límites del menú
    if (nextIndex < 0) {
      nextIndex = 0;
    }

    if (nextIndex >= navigationItems.length) {
      nextIndex = navigationItems.length - 1;
    }

    const nextLink = linkRefs.current[nextIndex];

    if (!nextLink) {
      return;
    }

    // Pasar el foco al siguiente elemento
    nextLink.focus();

    // ESTA ES LA PARTE IMPORTANTE:
    // hace que el menú se desplace automáticamente
    // aunque el elemento esté fuera de la zona visible.
    nextLink.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        darkMode
          ? "bg-gray-950 text-gray-100"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* COMMAND PALETTE */}

      <CommandPalette />

      {/* BOTÓN MENÚ MOBILE */}

      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-gray-900 p-2 text-white shadow-lg md:hidden dark:bg-white dark:text-gray-900"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* FONDO MOBILE */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } md:translate-x-0 ${
          darkMode
            ? "border-gray-800 bg-gray-900"
            : "border-gray-200 bg-white"
        }`}
      >
        {/* LOGO */}

        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-6 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold tracking-wide">
              DF ACHURAS
            </h2>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              Sistema de gestión
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden dark:hover:bg-gray-800"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* NAVEGACIÓN */}

        <nav
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
          aria-label="Navegación principal"
        >
          {navigationItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                ref={(element) => {
                  linkRefs.current[index] = element;
                }}
                onClick={() => setSidebarOpen(false)}
                onKeyDown={(event) =>
                  handleMenuKeyDown(event, index)
                }
                title={
                  item.shortcut
                    ? `${item.label} (${item.shortcut})`
                    : item.label
                }
                className={({ isActive }) =>
                  `group mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                    isActive
                      ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />

                <span className="min-w-0 flex-1 truncate">
                  {item.label}
                </span>

                {item.shortcut && (
                  <kbd className="hidden shrink-0 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 lg:inline-block dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    {item.shortcut}
                  </kbd>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* INFORMACIÓN INFERIOR */}

        <div className="shrink-0 border-t border-gray-200 p-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white dark:bg-white dark:text-gray-900">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user?.name || "Usuario"}
              </p>

              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {user?.role || "Sin rol"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-gray-600"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 md:ml-64">
        {/* TOPBAR */}

        <header
          className={`sticky top-0 z-30 flex min-h-16 items-center justify-between border-b px-6 py-4 pl-16 md:pl-6 ${
            darkMode
              ? "border-gray-800 bg-gray-950/95"
              : "border-gray-200 bg-white/95"
          } backdrop-blur`}
        >
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Panel de administración
            </span>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <strong className="block text-sm">
                {user?.name || "Usuario"}
              </strong>

              <small className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role || "Sin rol"}
              </small>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white dark:bg-white dark:text-gray-900">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {/* CONTENIDO */}

        <main className="min-h-[calc(100vh-64px)] bg-gray-50 p-4 text-gray-900 transition-colors sm:p-6 dark:bg-gray-950 dark:text-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
