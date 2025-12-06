'use client';

import {
  useGetBooksQuery,
  useGetFiltersQuery,
} from '@/src/features/books/api/bookApi';
import { BookCard } from '@/src/components/book/BookCard';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { BookOrderField } from '@/src/features/books/api/bookApi';

export default function BooksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Get params from URL
  const selectedGenres = searchParams.get('genres') || undefined;
  const selectedTags = searchParams.get('tags') || undefined;
  const sortByParam = searchParams.get('sortBy') || 'createdAt';
  const orderParam = searchParams.get('order') || 'desc';
  const searchQuery = searchParams.get('search') || undefined;

  // Map sortBy values
  const sortByMap: Record<string, BookOrderField> = {
    newest: 'createdAt',
    oldest: 'createdAt',
    'most-read': 'views',
    'highest-rating': 'rating',
    'most-liked': 'likes',
  };

  const currentSortBy =
    sortByMap[sortByParam] || (sortByParam as BookOrderField);
  const currentOrder =
    sortByParam === 'createdAt' && orderParam === 'asc'
      ? 'asc'
      : (orderParam as 'asc' | 'desc');

  // Fetch filters (genres & tags)
  const { data: filters, isLoading: filtersLoading } = useGetFiltersQuery();

  // Fetch books with API filters
  const { data, isLoading, isFetching } = useGetBooksQuery({
    page,
    limit: 20,
    search: searchQuery,
    genres: selectedGenres ? [selectedGenres] : undefined,
    tags: selectedTags ? [selectedTags] : undefined,
    sortBy: currentSortBy,
    order: currentOrder,
  });

  const newBooks = data?.data || [];
  const metaData = data?.metaData;

  // Reset when filters change
  useEffect(() => {
    setPage(1);
    setAllBooks([]);
    setHasMore(true);
  }, [searchQuery, selectedGenres, selectedTags, sortByParam, orderParam]);

  // Append new books
  useEffect(() => {
    if (newBooks.length > 0 && metaData) {
      if (page === 1) {
        setAllBooks(newBooks);
      } else {
        setAllBooks((prev) => {
          const uniqueBooks = newBooks.filter(
            (book: any) => !prev.some((b) => b.id === book.id)
          );
          return [...prev, ...uniqueBooks];
        });
      }
      setHasMore(metaData.page < metaData.totalPages);
    } else if (!isLoading && !isFetching && page > 1) {
      setHasMore(false);
    }
  }, [newBooks, metaData, page, isLoading, isFetching]);

  // Infinite scroll observer
  const lastBookRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetching || !hasMore) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setPage((prev) => prev + 1);
          }
        },
        { rootMargin: '200px' }
      );

      if (node) observer.observe(node);
      return () => observer.disconnect();
    },
    [isFetching, hasMore]
  );

  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      return params.toString();
    },
    [searchParams]
  );

  const handleSortChange = (value: string) => {
    let sortBy = value;
    let order = 'desc';

    if (value === 'oldest') {
      sortBy = 'createdAt';
      order = 'asc';
    }

    const query = createQueryString({
      sortBy,
      order,
    });
    router.push(`${pathname}?${query}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = createQueryString({
      search: searchInput.trim(),
    });
    router.push(`${pathname}?${query}`);
  };

  const clearSearch = () => {
    setSearchInput('');
    const query = createQueryString({
      search: '',
    });
    router.push(`${pathname}?${query}`);
  };

  const toggleGenre = (genreSlug: string) => {
    const query = createQueryString({
      genres: selectedGenres === genreSlug ? '' : genreSlug,
    });
    router.push(`${pathname}?${query}`);
  };

  const toggleTag = (tag: string) => {
    const query = createQueryString({
      tags: selectedTags === tag ? '' : tag,
    });
    router.push(`${pathname}?${query}`);
  };

  // Get genres and tags from filters API
  const allGenres = filters?.genres || [];
  const allTags = filters?.tags || [];

  if ((isLoading && page === 1) || filtersLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#141414] flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#161515] text-gray-900 dark:text-gray-100 font-sans selection:bg-red-600 selection:text-white relative transition-colors duration-300">
      {/* GLOBAL BACKGROUND FIXED */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/main-background.jpg"
          alt="Background Texture"
          className="w-full h-full object-cover opacity-10 dark:opacity-40 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-white/60 dark:bg-[#0f0f0f]/70 transition-colors duration-300"></div>
      </div>

      <div className="relative z-10">
        <main className="container mx-auto px-4 md:px-12 py-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 dark:border-white/10 pb-6 transition-colors duration-300">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-wide mb-2 transition-colors duration-300">
                Thư Viện
              </h1>
              <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                Khám phá hàng ngàn đầu sách hấp dẫn
              </p>
            </div>
          </div>

          {/* Search Bar - Glassmorphism Style */}
          <form onSubmit={handleSearch} className="mb-10 max-w-3xl mx-auto">
            <div className="relative group">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm tên truyện, tác giả..."
                className="block w-full pl-5 pr-12 py-4 rounded-full bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 backdrop-blur-sm transition-all shadow-lg"
              />
              {(searchInput || searchQuery) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                Kết quả cho:{' '}
                <span className="text-gray-900 dark:text-white font-semibold">
                  "{searchQuery}"
                </span>{' '}
                ({metaData?.total || 0} truyện)
              </div>
            )}
          </form>

          {/* Filters & Sorting */}
          <div className="flex flex-col lg:flex-row gap-8 mb-10">
            {/* Left Column: Filters */}
            <div className="flex-1 space-y-6">
              {/* Genres Filter */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Filter size={16} className="text-red-500" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 transition-colors duration-300">
                    Thể loại
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      router.push(
                        pathname + `?${createQueryString({ genres: '' })}`
                      )
                    }
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 border ${
                      !selectedGenres
                        ? 'bg-red-600 border-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]'
                        : 'bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-red-400 dark:hover:border-white/30 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    Tất cả
                  </button>
                  {allGenres.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => toggleGenre(genre.slug)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 border ${
                        selectedGenres === genre.slug
                          ? 'bg-red-600 border-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]'
                          : 'bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-red-400 dark:hover:border-white/30 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-3 mt-4 transition-colors duration-300">
                    Tags phổ biến
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag.name}
                        onClick={() => toggleTag(tag.name)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors border ${
                          selectedTags === tag.name
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white font-bold'
                            : 'bg-transparent border-gray-300 dark:border-white/10 text-gray-500 dark:text-gray-500 hover:border-gray-500 dark:hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        #{tag.name}
                        <span className="ml-1 opacity-60">({tag.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sort */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Sắp xếp theo
                </h3>
              </div>

              {/* Custom Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between bg-white dark:bg-white/5 backdrop-blur-sm border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all hover:bg-gray-50 dark:hover:bg-white/10 shadow-lg"
                >
                  <span>
                    {sortByParam === 'createdAt' &&
                      orderParam === 'desc' &&
                      'Mới nhất'}
                    {sortByParam === 'createdAt' &&
                      orderParam === 'asc' &&
                      'Cũ nhất'}
                    {sortByParam === 'views' && 'Đọc nhiều nhất'}
                    {sortByParam === 'rating' && 'Đánh giá cao'}
                    {sortByParam === 'likes' && 'Yêu thích nhất'}
                    {sortByParam === 'updatedAt' && 'Mới cập nhật'}
                  </span>
                  <ChevronDown
                    className={`text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    size={18}
                  />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    />

                    <div className="absolute top-full mt-2 w-full bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-white/10 rounded-lg shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200 transition-colors">
                      {[
                        {
                          value: 'createdAt',
                          order: 'desc',
                          label: 'Mới nhất',
                        },
                        {
                          value: 'updatedAt',
                          order: 'desc',
                          label: 'Mới cập nhật',
                        },
                        { value: 'createdAt', order: 'asc', label: 'Cũ nhất' },
                        {
                          value: 'views',
                          order: 'desc',
                          label: 'Đọc nhiều nhất',
                        },
                        {
                          value: 'rating',
                          order: 'desc',
                          label: 'Đánh giá cao',
                        },
                        {
                          value: 'likes',
                          order: 'desc',
                          label: 'Yêu thích nhất',
                        },
                      ].map((option) => {
                        const isActive =
                          sortByParam === option.value &&
                          orderParam === option.order;
                        return (
                          <button
                            key={`${option.value}-${option.order}`}
                            onClick={() => {
                              const query = createQueryString({
                                sortBy: option.value,
                                order: option.order,
                              });
                              router.push(`${pathname}?${query}`);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 transition-colors ${
                              isActive
                                ? 'bg-red-600 text-white font-semibold'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedGenres || selectedTags) && (
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-white/5 overflow-x-auto scrollbar-hide transition-colors duration-300">
              <span className="text-xs text-gray-500 uppercase font-bold whitespace-nowrap">
                Đang lọc:
              </span>
              {selectedGenres && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded hover:bg-red-500/20 transition-colors">
                  {allGenres.find((g) => g.slug === selectedGenres)?.name ||
                    selectedGenres}
                  <button onClick={() => toggleGenre(selectedGenres)}>
                    <X size={12} />
                  </button>
                </div>
              )}
              {selectedTags && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">
                  #{selectedTags}
                  <button onClick={() => toggleTag(selectedTags)}>
                    <X size={12} />
                  </button>
                </div>
              )}
              <button
                onClick={() =>
                  router.push(
                    pathname +
                      `?${createQueryString({
                        genres: '',
                        tags: '',
                      })}`
                  )
                }
                className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white underline whitespace-nowrap ml-auto transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {/* Book Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {allBooks.map((book, index) => {
              if (index === allBooks.length - 1) {
                return (
                  <div key={book.id} ref={lastBookRef} className="w-full">
                    <BookCard book={book} />
                  </div>
                );
              }
              return (
                <div key={book.id} className="w-full">
                  <BookCard book={book} />
                </div>
              );
            })}
          </div>

          {/* Loading More */}
          {isFetching && page > 1 && (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent"></div>
                <span>Đang tải thêm sách...</span>
              </div>
            </div>
          )}

          {/* No More Books */}
          {!hasMore && allBooks.length > 0 && (
            <div className="flex justify-center py-8 text-gray-500 dark:text-gray-400">
              <p>Đã hiển thị tất cả sách</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && allBooks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-white/5 rounded-2xl border border-gray-300 dark:border-white/10 mt-8 transition-colors duration-300">
              <div className="bg-gray-200 dark:bg-white/10 p-4 rounded-full mb-4 transition-colors duration-300">
                <Search size={32} className="text-gray-400" />
              </div>
              <p className="text-xl text-gray-900 dark:text-white font-medium mb-2 transition-colors duration-300">
                Không tìm thấy truyện nào
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.
              </p>
              <button
                onClick={() => router.push(pathname)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors font-medium"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
