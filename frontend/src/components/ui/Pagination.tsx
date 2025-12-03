import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const renderPageNumbers = () => {
    if (totalPages <= 7) {
      return pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            currentPage === page
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          {page}
        </button>
      ));
    }


    const visiblePages = pages.filter(
      (p) =>
        p === 1 ||
        p === totalPages ||
        (p >= currentPage - 1 && p <= currentPage + 1)
    );
    
    return visiblePages.map((page, index, array) => {
      const prev = array[index - 1];
      const showDots = prev && page - prev > 1;
      
      return (
        <React.Fragment key={page}>
          {showDots && <span className="px-2 text-gray-400">...</span>}
          <button
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              currentPage === page
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {page}
          </button>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 text-gray-600 dark:text-gray-400"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-1">{renderPageNumbers()}</div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 text-gray-600 dark:text-gray-400"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};
