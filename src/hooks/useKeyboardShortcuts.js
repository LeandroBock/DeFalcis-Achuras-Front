import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { navigationItems } from "../config/navigation";

/**
 * Atajos globales de navegación:
 *  - Alt + 1 ... Alt + 0  -> ir a la sección (ver config/navigation.js)
 *  - Alt + M              -> volver al menú lateral (foco en el link activo)
 *
 * Usa event.code (tecla física) en vez de event.key, así funciona igual en
 * Mac (donde Option + 1 produce "¡") y aunque el foco esté dentro de un input.
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(event) {
      // Solo Alt solo (sin Ctrl, Cmd ni Shift)
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      // Si hay un modal o la paleta abierta, no navegar por detrás
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return;
      }

      // Alt + M: volver al menú lateral
      if (event.code === "KeyM") {
        event.preventDefault();

        document
          .querySelector(
            'nav[aria-label="Navegación principal"] a[aria-current="page"]',
          )
          ?.focus();

        return;
      }

      // Alt + número: ir a la sección
      const item = navigationItems.find(
        (navigationItem) =>
          navigationItem.key && event.code === `Digit${navigationItem.key}`,
      );

      if (!item) {
        return;
      }

      event.preventDefault();
      navigate(item.to);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate]);
}
