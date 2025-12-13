'use client';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { SORT_OPTIONS } from '@/src/features/books/books.constants';

export const SortDropdown = ({
  currentSort,
  currentOrder,
  onSortChange,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeLabel =
    SORT_OPTIONS.find(
      (s) => s.value === currentSort && s.order === currentOrder
    )?.label || 'Sắp xếp';

  return (
    <div className="lg:w-64 flex-shrink-0">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">
        Sắp xếp theo
      </h3>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white rounded-lg px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
        >
          <span>{activeLabel}</span>
          <ChevronDown
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
            size={18}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-white/10 rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={`${option.value}-${option.order}`}
                  onClick={() => {
                    onSortChange(option.value, option.order);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    currentSort === option.value &&
                    currentOrder === option.order
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
