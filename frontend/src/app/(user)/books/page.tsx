'use client';

import Image from 'next/image';
import { useGetFiltersQuery } from '@/features/books/api/bookApi';
import { BookCard } from '@/components/book/BookCard';
import { Search } from 'lucide-react';

import { useBookParams } from '@/features/books/hooks/useBookParams';
import { useBookPagination } from '@/features/books/hooks/useBookPagination';

import { SearchBar } from '@/components/book/SearchBar';
import { FilterSection } from '@/components/book/FilterSection';
import { SortDropdown } from '@/components/book/SortDropdown';
import { useTracking, UserEventType } from '@/hooks/use-tracking';
import { useEffect } from 'react';
import { HorizontalFilters } from '@/components/book/HorizontalFilters';
import { ActiveFilters } from '@/components/book/ActiveFilters';

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
    clearGenres,
    clearAll,
  } = useBookParams();

  const { data: filtersData } =
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

  const { trackEvent } = useTracking();

  useEffect(() => {
    if (searchQuery && searchQuery.trim().length >= 2) {
      trackEvent({
        eventType: UserEventType.SEARCH,
        metadata: { keyword: searchQuery }
      });
    }
  }, [searchQuery, trackEvent]);

  return (
    <div className="min-h-screen bg-background text-foreground relative transition-colors duration-300">
      {/* HERO BANNER */}
      <div className="relative w-full h-[30vh] min-h-[260px] max-h-[350px] flex items-center justify-center overflow-hidden bg-slate-900 dark:bg-black">
        <Image
          src="/main-background.jpg"
          alt="Background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40 dark:opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-black/20 dark:bg-black/50" />
        <div className="relative z-10 text-center w-full max-w-3xl px-4 flex flex-col items-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
            Khám Phá Thư Viện
          </h1>
          <p className="text-white/90 mb-8 text-sm md:text-base font-medium max-w-xl drop-shadow-sm">
            Hàng ngàn tựa sách hấp dẫn đang chờ bạn khám phá. Tìm kiếm ngay để bắt đầu hành trình đọc sách của bạn!
          </p>
          <div className="w-full max-w-xl shadow-2xl rounded-full bg-background p-1.5 flex items-center">
            <div className="flex-1">
              <SearchBar
                compact={false}
                initialValue={searchQuery}
                onSearch={setSearch}
                onClear={clearSearch}
              />
            </div>
          </div>
        </div>
      </div>

      {/* HORIZONTAL CATEGORIES */}
      <HorizontalFilters
        allGenres={filtersData?.genres || []}
        allTags={filtersData?.tags || []}
        selectedGenres={genres}
        selectedTags={tags}
        onToggleGenre={(slug: string) => toggleFilter('genres', slug)}
        onToggleTag={(tag: string) => toggleFilter('tags', tag)}
        onClearGenres={clearGenres}
        onClearFilters={clearFilters}
      />

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-4 md:px-8 py-8 lg:py-10 relative z-10">
        <div className="flex flex-col gap-8">
          {/* RIGHT CONTENT (BOOKS) - Now Full Width */}
          <section className="flex-1 min-w-0">
            {/* Header: Results count, Active Filters & Sort */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : 'Tất cả sách'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {metaData?.total ? `Hiển thị ${metaData.total} kết quả` : 'Đang tải...'}
                  </p>
                </div>
                <SortDropdown
                  currentSort={sortBy}
                  currentOrder={order}
                  onSortChange={setSort}
                />
              </div>

              {/* Active Filters Row */}
              <ActiveFilters
                genres={genres}
                tags={tags}
                allGenres={filtersData?.genres || []}
                onRemoveGenre={(slug: string) => toggleFilter('genres', slug)}
                onRemoveTag={(tag: string) => toggleFilter('tags', tag)}
                onClearAll={clearFilters}
              />
            </div>

            {/* Books Grid */}
            {isBooksLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
              </div>
            ) : books.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
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
              <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-2xl border border-border/50 mt-4">
                <div className="bg-background shadow-sm p-4 rounded-full mb-4">
                  <Search size={32} className="text-muted-foreground/50" />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">
                  Không tìm thấy truyện nào
                </p>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  Thử thay đổi từ khóa hoặc xóa bớt các bộ lọc để xem nhiều kết quả hơn.
                </p>
                <button
                  onClick={clearAll}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors font-medium shadow-sm hover:shadow"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}

            {isFetchingMore && (
              <div className="flex justify-center py-8 gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                <span className="text-sm font-medium">Đang tải thêm sách...</span>
              </div>
            )}

            {!hasMore && books.length > 0 && (
              <div className="flex justify-center py-10 text-muted-foreground relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-border/60"></div>
                </div>
                <div className="relative bg-background px-4">
                  <p className="text-sm font-medium">Bạn đã xem hết sách!</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
