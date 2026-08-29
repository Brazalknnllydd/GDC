import { useEffect, useMemo, useState } from 'react';

type UsePaginationOptions<T> = {
  items: T[];
  itemsPerPage: number;
  resetDependencies?: readonly unknown[];
};

export function usePagination<T>({
  items,
  itemsPerPage,
  resetDependencies = [],
}: UsePaginationOptions<T>) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const startIndex = page * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, itemsPerPage, page]);
  const startItem = items.length === 0 ? 0 : page * itemsPerPage + 1;
  const endItem = Math.min((page + 1) * itemsPerPage, items.length);

  const visiblePageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index);
    }

    if (page <= 1) {
      return [0, 1, 2, 3, 4];
    }

    if (page >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, index) => totalPages - 5 + index);
    }

    return [page - 1, page, page + 1];
  }, [page, totalPages]);

  useEffect(() => {
    const timeout = setTimeout(() => setPage(0), 0);
    return () => clearTimeout(timeout);
  }, resetDependencies);

  useEffect(() => {
    if (page <= totalPages - 1) {
      return;
    }

    const timeout = setTimeout(() => setPage(Math.max(totalPages - 1, 0)), 0);
    return () => clearTimeout(timeout);
  }, [page, totalPages]);

  return {
    endItem,
    page,
    paginatedItems,
    setPage,
    startItem,
    totalPages,
    visiblePageNumbers,
  };
}
