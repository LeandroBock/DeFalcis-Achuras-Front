import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut, Menu, Search, X } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { navigationItems } from "../config/navigation";
import CommandPalette, {
  OPEN_COMMAND_PALETTE_EVENT,
} from "../components/CommandPalette";

function Layout() {
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navRef = useRef(null);
  const linkRefs = useRef([]);
  const menuButtonRef = useRef(null);
  const mainRef = useRef(null);
  const firstRender = useRef(true);

  // Atajos globales (Alt + número, Alt + M)
  useKeyboardShortcuts();

  // Al cambiar de ruta: cerrar el menú mobile y llevar el foco al contenido,
  // así no hay que tabular por todo el menú para llegar a la pantalla.
  useEffect(() => {
    setSidebarOpen(false);

    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    mainRef.current?.focus();
  }, [location.pathname]);

  // Menú mobile abierto: foco al link activo y Esc para cerrar
  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    const target =
      navRef.current?.querySelector('a[aria-current="page"]') ||
      linkRefs.current[0];

    target?.focus();

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [sidebarOpen]);

  // Navegación del menú con flechas, Home y End.
  // focus() ya desplaza el menú hasta el link, no hace falta scrollIntoView.
  function handleMenuKeyDown(event, index) {
    const last = navigationItems.length - 1;

    const targets = {
      ArrowDown: Math.min(index + 1, last),
      ArrowUp: Math.max(index - 1, 0),
      Home: 0,
      End: last,
    };

    if (!(event.key in targets)) {
      return;
    }

    event.preventDefault();
    linkRefs.current[targets[event.key]]?.focus();
  }

  function openCommandPalette() {
    window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        darkMode
          ? "bg-gray-950 text-gray-100"
          : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* SALTAR AL CONTENIDO (solo visible al recibir foco) */}

      <a
        href="#contenido"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        Saltar al contenido
      </a>

      {/* COMMAND PALETTE */}

      <CommandPalette />

      {/* BOTÓN MENÚ MOBILE */}

      <button
        ref={menuButtonRef}
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-gray-900 p-2 text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 md:hidden dark:bg-white dark:text-gray-900"
        aria-label="Abrir menú"
        aria-expanded={sidebarOpen}
        aria-controls="sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* FONDO MOBILE (tabIndex -1: con teclado se cierra con Esc) */}

      {sidebarOpen && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* SIDEBAR
          max-md:invisible: cerrado en mobile no recibe foco con Tab.
          Requiere Tailwind 3.2 o superior. */}

      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-[transform,visibility] duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full max-md:invisible"
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
            onClick={() => {
              setSidebarOpen(false);
              menuButtonRef.current?.focus();
            }}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 md:hidden dark:hover:bg-gray-800"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* NAVEGACIÓN */}

        <nav
          ref={navRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
          aria-label="Navegación principal"
        >
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const shortcut = item.key ? `Alt + ${item.key}` : null;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                ref={(element) => {
                  linkRefs.current[index] = element;
                }}
                onKeyDown={(event) => handleMenuKeyDown(event, index)}
                title={
                  shortcut ? `${item.label} (${shortcut})` : item.label
                }
                aria-keyshortcuts={
                  item.key ? `Alt+${item.key}` : undefined
                }
                className={({ isActive }) =>
                  `group mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
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

                {shortcut && (
                  <kbd className="hidden shrink-0 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 lg:inline-block dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    {shortcut}
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-gray-600"
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

          <div className="flex items-center gap-3">
            {/* Botón que abre la paleta: ayuda a descubrir Ctrl + K */}

            <button
              type="button"
              onClick={openCommandPalette}
              aria-label="Buscar sección"
              aria-keyshortcuts="Control+K Meta+K"
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <Search className="h-4 w-4" />

              <span className="hidden sm:inline">Buscar…</span>

              <kbd className="hidden rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 sm:inline-block dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                Ctrl K
              </kbd>
            </button>

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
          </div>
        </header>

        {/* CONTENIDO */}

        <main
          id="contenido"
          ref={mainRef}
          tabIndex={-1}
          className="min-h-[calc(100vh-64px)] bg-gray-50 p-4 text-gray-900 transition-colors focus:outline-none sm:p-6 dark:bg-gray-950 dark:text-gray-100"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
