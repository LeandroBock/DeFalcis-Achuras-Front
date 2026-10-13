import { ChevronLeft, ChevronRight } from "lucide-react";

// Se usa junto con usePagination. No se muestra si hay una sola página.
function Pagination({ page, totalPages, totalItems, pageSize, setPage }) {
  if (totalPages <= 1) {
    return null;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const buttonClass =
    "flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800";

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 text-sm sm:flex-row dark:border-gray-800"
    >
      <span className="text-gray-500 dark:text-gray-400">
        Mostrando {from}–{to} de {totalItems}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className={buttonClass}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </button>

        <span className="px-2 tabular-nums" aria-current="page">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className={buttonClass}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
