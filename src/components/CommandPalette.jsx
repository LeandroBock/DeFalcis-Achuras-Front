import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Search, X } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { navigationItems } from "../config/navigation";

// Evento para abrir la paleta desde cualquier lado (ej: botón del topbar)
export const OPEN_COMMAND_PALETTE_EVENT = "open-command-palette";

// Minúsculas y sin tildes: "Categorías" y "categorias" coinciden
function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function CommandPalette() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const previousFocus = useRef(null);

  // Comandos = secciones + acciones.
  // Para sumar una acción nueva, agregá un objeto con id, label, description,
  // keywords, icon y run(). Ejemplo:
  //   { id: "new-customer", label: "Nuevo cliente", description: "Abrir el formulario",
  //     keywords: ["agregar", "crear"], icon: UserPlus,
  //     run: () => navigate("/customers?nuevo=1") }
  const commands = useMemo(() => {
    const sections = navigationItems.map((item) => ({
      id: item.to,
      label: item.label,
      description: item.description,
      keywords: item.keywords,
      icon: item.icon,
      shortcut: item.key ? `Alt + ${item.key}` : null,
      run: () => navigate(item.to),
    }));

    const actions = [
      {
        id: "logout",
        label: "Cerrar sesión",
        description: "Salir del sistema",
        keywords: ["salir", "logout"],
        icon: LogOut,
        shortcut: null,
        run: logout,
      },
    ];

    return [...sections, ...actions];
  }, [navigate, logout]);

  const filteredCommands = useMemo(() => {
    const term = normalize(search.trim());

    if (!term) {
      return commands;
    }

    return commands.filter((command) =>
      normalize(
        [command.label, command.description, ...command.keywords].join(" "),
      ).includes(term),
    );
  }, [commands, search]);

  // Atajos para abrir/cerrar: Ctrl + K (Windows/Linux) o Cmd + K (Mac)
  useEffect(() => {
    function handleShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handleOpenEvent() {
      setOpen(true);
    }

    window.addEventListener("keydown", handleShortcut);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);
    };
  }, []);

  // Al abrir: guardar dónde estaba el foco y llevarlo al buscador.
  // Al cerrar: limpiar y devolver el foco a donde estaba.
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedIndex(0);
      previousFocus.current?.focus();
      previousFocus.current = null;
      return;
    }

    previousFocus.current = document.activeElement;

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [open]);

  // Al cambiar la búsqueda, volver a seleccionar el primer resultado
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  function close() {
    setOpen(false);
  }

  function executeCommand(command) {
    close();
    command.run();
  }

  // El foco siempre queda en el input; el resultado activo se anuncia
  // con aria-activedescendant y se mantiene visible con scrollIntoView.
  function moveSelection(nextIndex) {
    setSelectedIndex(nextIndex);

    document
      .getElementById(`command-${nextIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }

  function handleKeyDown(event) {
    const count = filteredCommands.length;

    // Evita que el foco se escape del diálogo hacia la página de atrás
    if (event.key === "Tab") {
      event.preventDefault();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (!count) {
        return;
      }

      const step = event.key === "ArrowDown" ? 1 : -1;

      // Da la vuelta al llegar al principio o al final
      moveSelection((selectedIndex + step + count) % count);
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      // Home/End mueven el cursor del input; con Ctrl saltan en la lista
      if (!event.ctrlKey) {
        return;
      }

      event.preventDefault();

      if (count) {
        moveSelection(event.key === "Home" ? 0 : count - 1);
      }

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const command = filteredCommands[selectedIndex];

      if (command) {
        executeCommand(command);
      }
    }

    // Escape lo maneja el listener global
  }

  if (!open) {
    return null;
  }

  const activeCommand = filteredCommands[selectedIndex];

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
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-autocomplete="list"
            aria-activedescendant={
              activeCommand ? `command-${selectedIndex}` : undefined
            }
            aria-label="Buscar sección"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="¿A dónde querés ir?"
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
            autoComplete="off"
          />

          {/* tabIndex -1: con teclado se cierra con Esc */}
          <button
            type="button"
            tabIndex={-1}
            onClick={close}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* RESULTADOS */}

        <div
          id="command-list"
          role="listbox"
          aria-label="Resultados"
          className="max-h-[60vh] overflow-y-auto p-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-10 text-center" role="status">
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
                  key={command.id}
                  id={`command-${index}`}
                  role="option"
                  aria-selected={selected}
                  type="button"
                  tabIndex={-1}
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

                  {selected ? (
                    <kbd className="hidden rounded border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-500 sm:block dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                      Enter
                    </kbd>
                  ) : (
                    command.shortcut && (
                      <kbd className="hidden rounded border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-400 sm:block dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500">
                        {command.shortcut}
                      </kbd>
                    )
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
