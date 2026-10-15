import { useEffect, useRef, useState } from "react";

// Nombre de la tecla para aria-keyshortcuts: "Enter", "Delete", "Space", "P"...
const ariaKey = (key) => (key.length === 1 ? key.toUpperCase() : key);

// Tecla del evento con el mismo nombre que en `actions`.
const eventKey = (event) =>
  event.key === " "
    ? "Space"
    : event.key.length === 1
      ? event.key.toLowerCase()
      : event.key;

/**
 * Tabla que se recorre con el teclado, como en Clientes: la tabla es una sola
 * parada de Tab; adentro se mueve con flechas (Inicio/Fin al primero y al
 * último) y cada fila tiene sus atajos (Enter, Supr, letras).
 *
 *   const rows = useRowNavigation(pageItems.length);
 *   <tr {...rows.rowProps(index, { Enter: () => edit(item), Delete: ... })}>
 *
 * Teclas: "Enter", "Delete", "Space" o una letra en minúscula ("p").
 *
 * Los botones de la fila llevan tabIndex={-1}: con teclado se usan los
 * atajos. Después de borrar una fila, rows.focusAfterChange() deja el foco
 * en la fila que ocupa su lugar (o en `fallbackRef` si no quedan).
 */
export function useRowNavigation(count, { fallbackRef } = {}) {
  const [active, setActive] = useState(0);
  const refs = useRef([]);
  const pendingFocus = useRef(false);

  const safeActive = Math.min(active, Math.max(count - 1, 0));

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;

    const target = count > 0 ? refs.current[Math.min(active, count - 1)] : null;
    (target ?? fallbackRef?.current)?.focus();
  }, [count, active, fallbackRef]);

  function focusRow(index) {
    refs.current[index]?.focus();
  }

  function rowProps(index, actions = {}) {
    return {
      ref: (element) => {
        refs.current[index] = element;
      },
      tabIndex: index === safeActive ? 0 : -1,
      // Una sola parada de Tab para toda la lista (se recorre con flechas).
      "data-roving": "",
      "aria-keyshortcuts":
        Object.keys(actions).map(ariaKey).join(" ") || undefined,
      onFocus: (event) => {
        if (event.target === event.currentTarget) setActive(index);
      },
      onKeyDown: (event) => {
        // Si el foco está en algo dentro de la fila, que actúe eso.
        if (event.target !== event.currentTarget) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;

        const last = count - 1;
        const move = {
          ArrowDown: Math.min(index + 1, last),
          ArrowUp: Math.max(index - 1, 0),
          Home: 0,
          End: last,
        }[event.key];

        if (move !== undefined) {
          event.preventDefault();
          focusRow(move);
          return;
        }

        const key = eventKey(event);
        const action = actions[key] ?? actions[ariaKey(key)];

        if (action) {
          event.preventDefault();
          action();
        }
      },
    };
  }

  return {
    rowProps,
    focusRow,
    focusAfterChange: () => {
      pendingFocus.current = true;
    },
  };
}

/**
 * Formulario con teclado: Esc cancela y Ctrl/Cmd + Enter guarda (también
 * desde un textarea).
 *
 *   <form onKeyDown={formKeys(closeForm)} ...>
 */
export const formKeys = (onCancel) => (event) => {
  if (event.key === "Escape" && onCancel) {
    // Un select desplegado o un modal adentro manejan su propio Esc.
    if (event.defaultPrevented) return;
    event.preventDefault();
    onCancel();
    return;
  }

  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    event.currentTarget.requestSubmit();
  }
};
