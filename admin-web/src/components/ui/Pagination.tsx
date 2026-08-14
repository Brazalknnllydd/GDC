import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="flex justify-between items-center" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Page {currentPage} of {safeTotalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
