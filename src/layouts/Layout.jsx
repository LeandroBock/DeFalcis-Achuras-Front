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
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Productos", icon: Package },
  { to: "/inventory", label: "Inventario", icon: Boxes },
  { to: "/categories", label: "Categorías", icon: Tags },
  { to: "/customers", label: "Clientes", icon: Users },
  { to: "/suppliers", label: "Proveedores", icon: Truck },
  { to: "/purchases", label: "Compras", icon: ShoppingCart },
  { to: "/payables", label: "Cuentas por pagar", icon: Wallet },
  { to: "/supplier-payments", label: "Pagos a proveedores", icon: CreditCard },
  { to: "/orders", label: "Ventas", icon: Receipt },
  { to: "/receivables", label: "Cuentas por cobrar", icon: DollarSign },
  { to: "/payments", label: "Pagos", icon: CreditCard },
  { to: "/expenses", label: "Gastos", icon: FileText },
  { to: "/employees", label: "Empleados", icon: UserRound },
  { to: "/reports", label: "Reportes", icon: BarChart3 },
  { to: '/whatsapp', label: 'WhatsApp', icon:FileText}
];

function Layout() {
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className={`min-h-screen transition-colors ${
        darkMode
          ? "bg-gray-950 text-gray-100"
          : "bg-gray-50 text-gray-900"
      }`}
    >
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
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${
          darkMode
            ? "border-gray-800 bg-gray-900"
            : "border-gray-200 bg-white"
        }`}
      >
        {/* LOGO */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-6 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold tracking-wide">DF ACHURAS</h2>

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
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* INFORMACIÓN INFERIOR */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white dark:bg-white dark:text-gray-900">
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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