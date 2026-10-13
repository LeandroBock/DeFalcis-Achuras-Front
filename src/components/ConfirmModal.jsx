import { useEffect, useId, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

function ConfirmModal({
  isOpen,
  title = "¿Confirmar eliminación?",
  message = "Esta acción no se puede deshacer.",
  onConfirm,
  onCancel,
  loading = false,
  confirmText = "Eliminar",
  loadingText = "Eliminando...",
}) {
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef(null);

  // Último onCancel/loading sin volver a correr el efecto en cada render
  const latest = useRef({ onCancel, loading });

  useEffect(() => {
    latest.current = { onCancel, loading };
  });

  // Al abrir: foco en "Cancelar" (la opción segura). Esc cierra.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    cancelRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !latest.current.loading) {
        latest.current.onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>

            <h2
              id={titleId}
              className="text-lg font-bold text-gray-900 dark:text-white"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mensaje */}
        <p
          id={messageId}
          className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300"
        >
          {message}
        </p>

        {/* Botones */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
