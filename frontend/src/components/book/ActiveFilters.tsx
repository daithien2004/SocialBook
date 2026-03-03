'use client';
import { X } from 'lucide-react';

import { FiltersData } from '@/features/books/types/book.interface';

interface ActiveFiltersProps {
  genres: string[];
  tags: string[];
  allGenres: FiltersData['genres'];
  onRemoveGenre: (slug: string) => void;
  onRemoveTag: (tag: string) => void;
  onClearAll: () => void;
}

export const ActiveFilters = ({
  genres,
  tags,
  allGenres,
  onRemoveGenre,
  onRemoveTag,
  onClearAll,
}: ActiveFiltersProps) => {
  if (genres.length === 0 && tags.length === 0) return null;

  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-white/5 overflow-x-auto scrollbar-hide">
      <span className="text-xs text-gray-500 uppercase font-bold whitespace-nowrap">
        Đang lọc:
      </span>

      {genres.map((slug: string) => {
        const name = allGenres?.find((g) => g.slug === slug)?.name || slug;
        return (
          <div
            key={slug}
            className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded hover:bg-red-500/20 transition-colors"
          >
            {name}
            <button onClick={() => onRemoveGenre(slug)}>
              <X size={12} />
            </button>
          </div>
        );
      })}

      {tags.map((tag: string) => (
        <div
          key={tag}
          className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 transition-colors"
        >
          #{tag}
          <button onClick={() => onRemoveTag(tag)}>
            <X size={12} />
          </button>
        </div>
      ))}

      <button
        onClick={onClearAll}
        className="text-xs text-gray-500 hover:text-red-600 underline whitespace-nowrap ml-auto"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
};
