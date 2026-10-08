import { useEffect, useRef } from "react";

function isTypingTarget(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    Boolean(target?.isContentEditable)
  );
}

/**
 * Atajo de una sola tecla para una pantalla (ej: "n" para "Nuevo").
 *
 * No se dispara si:
 *  - el foco está escribiendo en un input, textarea o select
 *  - hay un modal abierto (cualquier [role="dialog"][aria-modal="true"])
 *  - se está usando Ctrl, Cmd o Alt
 *
 * Uso:
 *   useShortcut("n", () => openForm(), { enabled: !showForm });
 */
export function useShortcut(key, handler, { enabled = true } = {}) {
  // Siempre llama a la versión más reciente del handler
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleKeyDown(event) {
      if (event.repeat) {
        return;
      }

      if (event.key.toLowerCase() !== key.toLowerCase()) {
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return;
      }

      event.preventDefault();
      handlerRef.current(event);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [key, enabled]);
}
