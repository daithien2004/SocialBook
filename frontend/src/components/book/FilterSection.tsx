'use client';
import { Filter } from 'lucide-react';

export const FilterSection = ({
  allGenres,
  allTags,
  selectedGenres,
  selectedTags,
  onToggleGenre,
  onToggleTag,
  onClearGenres,
}: any) => {
  return (
    <div className="flex-1 space-y-6">
      {/* Genres */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-red-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Thể loại
          </h3>
          {selectedGenres.length > 0 && (
            <span className="text-xs text-gray-500">
              ({selectedGenres.length})
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onClearGenres}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
              selectedGenres.length === 0
                ? 'bg-red-600 border-red-600 text-white shadow-md'
                : 'bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 hover:border-red-400 dark:hover:border-white/30'
            }`}
          >
            Tất cả
          </button>
          {allGenres?.map((genre: any) => (
            <button
              key={genre.id}
              onClick={() => onToggleGenre(genre.slug)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                selectedGenres.includes(genre.slug)
                  ? 'bg-red-600 border-red-600 text-white shadow-md'
                  : 'bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              {genre.name}
              {genre.count > 0 && (
                <span
                  className={`ml-1.5 text-xs ${
                    selectedGenres.includes(genre.slug)
                      ? 'opacity-80'
                      : 'opacity-60'
                  }`}
                >
                  ({genre.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      {allTags?.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 mt-4">
            Tags phổ biến
          </h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag: any) => (
              <button
                key={tag.name}
                onClick={() => onToggleTag(tag.name)}
                className={`px-3 py-1 rounded-full text-xs transition-colors border ${
                  selectedTags.includes(tag.name)
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 font-bold'
                    : 'bg-transparent border-gray-300 dark:border-white/10 text-gray-500 hover:border-gray-500'
                }`}
              >
                #{tag.name}{' '}
                <span className="ml-1 opacity-60">({tag.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
