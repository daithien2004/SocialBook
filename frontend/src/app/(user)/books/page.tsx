'use client';

import { useGetFiltersQuery } from '@/src/features/books/api/bookApi';
import { BookCard } from '@/src/components/book/BookCard';
import { Search } from 'lucide-react';

import { useBookParams } from '@/src/features/books/hooks/useBookParams';
import { useBookPagination } from '@/src/features/books/hooks/useBookPagination';

import { SearchBar } from '@/src/components/book/SearchBar';
import { FilterSection } from '@/src/components/book/FilterSection';
import { SortDropdown } from '@/src/components/book/SortDropdown';
import { ActiveFilters } from '@/src/components/book/ActiveFilters';

export default function BooksPage() {
  const {
    genres,
    tags,
    searchQuery,
    sortBy,
    order,
    toggleFilter,
    setSort,
    setSearch,
    clearSearch,
    clearFilters,
    clearAll,
    clearGenres,
  } = useBookParams();

  const { data: filtersData, isLoading: isFiltersLoading } =
    useGetFiltersQuery();

  const {
    books,
    isLoading: isBooksLoading,
    isFetchingMore,
    hasMore,
    lastBookRef,
    metaData,
  } = useBookPagination({
    search: searchQuery,
    genres,
    tags,
    sortBy,
    order,
  });

  if (isBooksLoading || isFiltersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#141414]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#161515] text-gray-900 dark:text-gray-100 relative transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/main-background.jpg"
          alt="Background"
          className="w-full h-full object-cover opacity-10 dark:opacity-40"
        />
        <div className="absolute inset-0 bg-white/60 dark:bg-[#0f0f0f]/70"></div>
      </div>

      <div className="relative z-10">
        <main className="container mx-auto px-4 md:px-12 py-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 dark:border-white/10 pb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-wide mb-2">
                Thư Viện
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Khám phá hàng ngàn đầu sách hấp dẫn
              </p>
            </div>
          </div>

          <SearchBar
            initialValue={searchQuery}
            onSearch={setSearch}
            onClear={clearSearch}
          />

          {searchQuery && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
              Kết quả cho:{' '}
              <span className="font-bold text-gray-900 dark:text-white">
                "{searchQuery}"
              </span>{' '}
              ({metaData?.total || 0} truyện)
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8 mb-10">
            <FilterSection
              allGenres={filtersData?.genres || []}
              allTags={filtersData?.tags || []}
              selectedGenres={genres}
              selectedTags={tags}
              onToggleGenre={(slug: string) => toggleFilter('genres', slug)}
              onToggleTag={(tag: string) => toggleFilter('tags', tag)}
              onClearGenres={clearGenres}
            />
            <SortDropdown
              currentSort={sortBy}
              currentOrder={order}
              onSortChange={setSort}
            />
          </div>

          <ActiveFilters
            genres={genres}
            tags={tags}
            allGenres={filtersData?.genres || []}
            onRemoveGenre={(slug: string) => toggleFilter('genres', slug)}
            onRemoveTag={(tag: string) => toggleFilter('tags', tag)}
            onClearAll={clearFilters}
          />

          {books.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
              {books.map((book, index) => (
                <div
                  key={`${book.id}-${index}`}
                  ref={index === books.length - 1 ? lastBookRef : null}
                  className="w-full"
                >
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 mt-8">
              <div className="bg-gray-200 dark:bg-white/10 p-4 rounded-full mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <p className="text-xl font-medium mb-2">
                Không tìm thấy truyện nào
              </p>
              <button
                onClick={clearAll}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors font-medium"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}

          {isFetchingMore && (
            <div className="flex justify-center py-8 gap-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent"></div>
              <span>Đang tải thêm sách...</span>
            </div>
          )}

          {!hasMore && books.length > 0 && (
            <div className="flex justify-center py-8 text-gray-500 dark:text-gray-400">
              <p>Đã hiển thị tất cả sách</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
