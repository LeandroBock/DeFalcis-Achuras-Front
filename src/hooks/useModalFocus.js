import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

// Modales abiertos, del de más abajo al de más arriba: solo el de arriba
// responde a Tab y Esc (por ejemplo, "¿Por qué no se entregó?" encima del
// formulario de entrega).
const openModals = [];

function focusableIn(container) {
  return [...container.querySelectorAll(FOCUSABLE)].filter(
    (element) =>
      element.offsetParent !== null || element === document.activeElement,
  );
}

/**
 * Comportamiento de teclado de un modal:
 * - al abrir, pone el foco adentro (en el elemento con data-autofocus, o en
 *   el primero que se pueda enfocar);
 * - Tab y Shift+Tab recorren solo el modal (el foco no se escapa a la
 *   pantalla de atrás);
 * - Esc lo cierra (onClose), salvo que closeDisabled sea true;
 * - al cerrar, el foco vuelve a donde estaba (por ejemplo, al botón que lo
 *   abrió).
 *
 * const ref = useModalFocus({ onClose, closeDisabled: saving });
 * <div ref={ref} role="dialog" aria-modal="true">...</div>
 */
export function useModalFocus({ onClose, closeDisabled = false } = {}) {
  const ref = useRef(null);

  // Quién tenía el foco al abrir (el botón que abrió el modal). Se anota en
  // el primer render: un autoFocus de adentro del modal mueve el foco antes
  // de que corran los efectos.
  const opener = useRef(undefined);
  if (opener.current === undefined) {
    opener.current =
      typeof document === "undefined" ? null : document.activeElement;
  }

  // Lo último sin volver a registrar el efecto en cada render.
  const latest = useRef({ onClose, closeDisabled });
  useEffect(() => {
    latest.current = { onClose, closeDisabled };
  });

  useEffect(() => {
    const container = ref.current;
    if (!container) return undefined;

    const previouslyFocused = opener.current;
    openModals.push(container);

    if (!container.contains(document.activeElement)) {
      const target =
        container.querySelector("[data-autofocus]") ??
        focusableIn(container)[0] ??
        container;
      if (target === container && !container.hasAttribute("tabindex")) {
        container.setAttribute("tabindex", "-1");
      }
      target.focus();
    }

    function handleKeyDown(event) {
      if (openModals[openModals.length - 1] !== container) return;

      if (event.key === "Escape") {
        // Elementos que usan Esc para otra cosa (por ejemplo, cancelar una
        // edición en línea) lo marcan con data-own-escape.
        if (
          event.target instanceof Element &&
          event.target.closest("[data-own-escape]")
        ) {
          return;
        }
        if (!latest.current.closeDisabled && latest.current.onClose) {
          event.preventDefault();
          event.stopPropagation();
          latest.current.onClose();
        }
        return;
      }

      if (event.key !== "Tab") return;

      const elements = focusableIn(container);
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !container.contains(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      openModals.splice(openModals.indexOf(container), 1);

      if (
        previouslyFocused instanceof HTMLElement &&
        document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus();
      }
    };
  }, []);

  return ref;
}
