'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BookOrderField, useGetBooksQuery } from '@/src/features/books/api/bookApi';
import { Book } from '@/src/features/books/types/book.interface';
import { ChevronDown, Search, X, Loader2 } from 'lucide-react';

interface BookSelectorProps {
  value: string; // bookId
  onChange: (bookId: string, book?: Book) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function BookSelector({
  value,
  onChange,
  disabled = false,
  placeholder = 'Chọn sách...',
}: BookSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching } = useGetBooksQuery({
    page,
    limit: 20,
    sortBy: 'trending' as BookOrderField,
  });

  const books = data?.data || [];
  const metaData = data?.metaData;

  // Cập nhật danh sách sách khi có data mới
  useEffect(() => {
    if (books.length > 0 && metaData) {
      setAllBooks((prev) => {
        if (page === 1) {
          return books;
        }
        // Loại bỏ duplicate
        const uniqueBooks = books.filter(
          (book) => !prev.some((b) => b.id === book.id)
        );
        return [...prev, ...uniqueBooks];
      });

      setHasMore(metaData.page < metaData.totalPages);
    }
  }, [books, page, metaData]);

  // Reset khi mở dropdown
  useEffect(() => {
    if (isOpen && page === 1 && allBooks.length === 0) {
      // Load initial data
    }
  }, [isOpen]);

  const selectedBook = allBooks.find((book) => book.id === value);

  const filteredBooks = allBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.authorId.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Infinite scroll observer
  const lastBookRef = useCallback(
    (node: HTMLButtonElement | null) => {
      if (isFetching || !hasMore || searchQuery) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setPage((prev) => prev + 1);
          }
        },
        { rootMargin: '100px' }
      );

      if (node) observer.observe(node);

      return () => observer.disconnect();
    },
    [isFetching, hasMore, searchQuery]
  );

  const handleSelect = (book: Book) => {
    onChange(book.id, book);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // Reset scroll position when opening
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
          }
        }, 0);
      }
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Selected Value Display */}
      <div
        onClick={handleOpen}
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={`w-full rounded-2xl px-3.5 py-2.5 text-sm flex items-center justify-between transition-colors border ${
          disabled
            ? 'bg-slate-100 border-slate-200 cursor-not-allowed'
            : 'bg-white border-slate-200 hover:border-sky-400 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedBook ? (
            <>
              <div className="w-8 h-10 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                <img
                  src={selectedBook.coverUrl}
                  alt={selectedBook.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-[13px] truncate">
                  {selectedBook.title}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {selectedBook.authorId.name}
                </p>
              </div>
            </>
          ) : (
            <span className="text-slate-400 text-sm">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedBook && !disabled && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              type="button"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-[min(60vh,24rem)] overflow-hidden flex flex-col">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sách..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                autoFocus
              />
            </div>
          </div>

          {/* Loading State - Initial */}
          {isLoading && allBooks.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
            </div>
          )}

          {/* Books List */}
          {!isLoading || allBooks.length > 0 ? (
            <div
              ref={scrollRef}
              className="overflow-y-auto flex-1"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 transparent',
              }}
            >
              {filteredBooks.length > 0 ? (
                <>
                  {filteredBooks.map((book, index) => {
                    const isLast = index === filteredBooks.length - 1;
                    const shouldObserve = isLast && !searchQuery && hasMore;

                    return (
                      <button
                        key={book.id}
                        ref={shouldObserve ? lastBookRef : null}
                        type="button"
                        onClick={() => handleSelect(book)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                          book.id === value ? 'bg-sky-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-9 h-12 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[13px] text-slate-900 truncate">
                            {book.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {book.authorId.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {book.publishedYear}
                          </p>
                        </div>
                        {book.id === value && (
                          <div className="flex-shrink-0 w-5 h-5 bg-sky-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px]">✓</span>
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {/* Loading More Indicator */}
                  {isFetching && !searchQuery && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                      <span className="ml-2 text-xs text-slate-500">
                        Đang tải thêm...
                      </span>
                    </div>
                  )}

                  {/* End of List */}
                  {!hasMore && !searchQuery && allBooks.length > 0 && (
                    <div className="text-center py-3 text-xs text-slate-400">
                      Đã hiển thị tất cả sách
                    </div>
                  )}
                </>
              ) : (
                <div className="px-4 py-8 text-center text-xs sm:text-sm text-slate-500">
                  {searchQuery ? 'Không tìm thấy sách nào' : 'Chưa có sách nào'}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
