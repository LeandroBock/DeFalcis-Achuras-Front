import { AlertCircle, RefreshCw } from "lucide-react";

// Estados de pantalla completa que comparten todas las páginas

export function LoadingState({
  icon: Icon = RefreshCw,
  message = "Cargando...",
}) {
  return (
    <div
      role="status"
      className="flex min-h-[300px] items-center justify-center gap-3 p-6 text-gray-500 dark:text-gray-400"
    >
      <Icon className="h-5 w-5 animate-pulse" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold transition hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/30"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
      )}

      <h3 className="font-semibold">{title}</h3>

      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {children}
    </div>
  );
}
