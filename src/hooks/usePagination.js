import { useState } from "react";

/**
 * Paginación del lado del cliente.
 *
 * const { pageItems, ...pagination } = usePagination(filteredOrders);
 * pageItems.map(...)
 * <Pagination {...pagination} />
 *
 * Si la lista se achica (por un filtro) y la página actual queda vacía,
 * se muestra la última página disponible.
 */
export function usePagination(items, pageSize = 20) {
  const [page, setPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    pageItems: items.slice(start, start + pageSize),
    page: currentPage,
    totalPages,
    totalItems,
    pageSize,
    setPage,
  };
}
