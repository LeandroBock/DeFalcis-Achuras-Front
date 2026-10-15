import { useCallback, useEffect, useRef } from "react";

const FIELDS = "input:not([type=hidden]):not([disabled]), select, textarea";

/**
 * Foco de un formulario que se abre en la misma pantalla: al abrirse va al
 * primer campo y al cerrarse vuelve a donde estaba (la fila o el botón
 * "Nuevo"), como en Clientes.
 *
 *   const { formRef, rememberFocus, restoreFocus } = useFormFocus(showForm);
 *   function openForm() { rememberFocus(); setShowForm(true); }
 *   function closeForm() { setShowForm(false); restoreFocus(newButtonRef); }
 *   <form ref={formRef} ...>
 *
 * `open` puede ser cualquier valor: cada vez que cambia a uno verdadero (por
 * ejemplo, el id de lo que se edita) el foco vuelve al primer campo.
 */
export function useFormFocus(open) {
  const node = useRef(null);
  const returnTo = useRef(null);

  useEffect(() => {
    if (open) node.current?.querySelector(FIELDS)?.focus();
  }, [open]);

  const ref = useCallback((element) => {
    node.current = element;
  }, []);

  const remember = useCallback(() => {
    returnTo.current = document.activeElement;
  }, []);

  const restore = useCallback((fallbackRef) => {
    requestAnimationFrame(() => {
      const previous = returnTo.current;
      const target =
        previous && previous !== document.body && document.contains(previous)
          ? previous
          : fallbackRef?.current;
      target?.focus();
    });
  }, []);

  return { formRef: ref, rememberFocus: remember, restoreFocus: restore };
}
