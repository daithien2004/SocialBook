'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useGetBooksQuery } from '@/features/books/api/bookApi';
import { useGetLibraryBooksQuery } from '@/features/library/api/libraryApi';
import { Book, BookOrderField } from '@/features/books/types/book.interface';
import { LibraryStatus } from '@/features/library/types/library.interface';
import { ChevronDown, Search, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BookSelectorProps {
  value: string | undefined;
  onChange: (bookId: string, book?: Book) => void;
  disabled?: boolean;
  placeholder?: string;
  onlyLibrary?: boolean;
}

export default function BookSelector({
  value,
  onChange,
  disabled = false,
  placeholder = 'Chọn sách...',
  onlyLibrary = false,
}: BookSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { 
    data: normalBooksData, 
    isLoading: isNormalLoading, 
    isFetching: isNormalFetching 
  } = useGetBooksQuery({
    page,
    limit: 20,
    sortBy: 'trending' as BookOrderField,
  }, { skip: onlyLibrary });

  const {
    data: libraryData,
    isLoading: isLibraryLoading,
    isFetching: isLibraryFetching
  } = useGetLibraryBooksQuery({
    status: 'READING,COMPLETED'
  }, { skip: !onlyLibrary });

  const books = useMemo(() => {
    if (onlyLibrary) {
      return libraryData?.map(item => item.bookId) || [];
    }
    return normalBooksData?.data || [];
  }, [onlyLibrary, normalBooksData, libraryData]);

  const meta = normalBooksData?.meta;
  const isLoading = onlyLibrary ? isLibraryLoading : isNormalLoading;
  const isFetching = onlyLibrary ? isLibraryFetching : isNormalFetching;

  useEffect(() => {
    if (books.length > 0) {
      setAllBooks((prev) => {
        if (page === 1 || onlyLibrary) { // Reset if first page or in library mode (which is not paginated on frontend yet)
          return books;
        }
        const uniqueBooks = books.filter(
          (book) => !prev.some((b) => b.id === book.id)
        );
        return [...prev, ...uniqueBooks];
      });

      if (meta) {
        setHasMore(meta.current < meta.totalPages);
      } else if (onlyLibrary) {
        setHasMore(false); // Library list is usually all-in-one in this API
      }
    }
  }, [books, page, meta, onlyLibrary]);

  const selectedBook = allBooks.find((book) => book.id === value);
  const filteredBooks = allBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.authorId.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const lastBookRef = useCallback(
    (node: HTMLButtonElement | null) => {
      if (isFetching || !hasMore || searchQuery || onlyLibrary) return;

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
      setIsOpen((prev) => !prev);
      if (!isOpen) {
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
        className={cn(
          "w-full rounded-2xl px-4 py-2.5 text-sm flex items-center justify-between transition-all border",
          disabled
            ? "bg-muted/50 border-border cursor-not-allowed opacity-60"
            : "bg-background border-border hover:border-primary active:scale-[0.99] cursor-pointer shadow-sm"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedBook ? (
            <>
              <div className="relative w-8 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                <Image
                  src={selectedBook.coverUrl}
                  alt={selectedBook.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-foreground text-[13px] truncate">
                  {selectedBook.title}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {selectedBook.authorId.name}
                </p>
              </div>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {selectedBook && !disabled && (
            <button
              onClick={handleClear}
              className="p-1.5 hover:bg-muted rounded-full transition-colors group"
              type="button"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180 text-foreground"
            )}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-popover text-popover-foreground border border-border rounded-2xl shadow-2xl max-h-[28rem] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Search Box */}
          <div className="p-4 border-b border-border sticky top-0 bg-popover/95 backdrop-blur-md z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sách..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Loading State - Initial */}
          {isLoading && allBooks.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {/* Books List */}
          {!isLoading || allBooks.length > 0 ? (
            <div
              ref={scrollRef}
              className="overflow-y-auto flex-1 thin-scrollbar p-2"
            >
              {filteredBooks.length > 0 ? (
                <div className="space-y-1">
                  {filteredBooks.map((book, index) => {
                    const isLast = index === filteredBooks.length - 1;
                    const shouldObserve = isLast && !searchQuery && hasMore;

                    return (
                      <button
                        key={book.id}
                        ref={shouldObserve ? lastBookRef : null}
                        type="button"
                        onClick={() => handleSelect(book)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all",
                          book.id === value
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="relative w-10 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                          <Image
                            src={book.coverUrl}
                            alt={book.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {book.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {book.authorId.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1.5 mt-1">
                            {book.publishedYear}
                          </p>
                        </div>
                        {book.id === value && (
                          <div className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-[10px] font-bold">✓</span>
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {/* Loading More Indicator */}
                  {isFetching && !searchQuery && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="ml-3 text-xs text-muted-foreground font-medium">
                        Đang tải thêm...
                      </span>
                    </div>
                  )}

                  {/* End of List */}
                  {!hasMore && !searchQuery && allBooks.length > 0 && (
                    <div className="text-center py-4 text-xs text-muted-foreground italic">
                      Đã hiển thị tất cả sách
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'Không tìm thấy sách nào' : 'Chưa có sách nào'}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
