'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@/features/library/api/libraryApi';
import { BookSummary } from '@/features/library/types/library.interface';
import { ChevronDown, Search, X, Loader2 } from 'lucide-react';
import { SafeImage } from '@/components/shared/SafeImage';
import { cn } from '@/lib/utils';

interface SelectableBook {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
  authorName: string;
  publishedYear?: string;
}

interface BookSelectorProps {
  value: string | undefined;
  onChange: (bookId: string, book?: SelectableBook) => void;
  disabled?: boolean;
  placeholder?: string;
}

function toSelectable(book: BookSummary): SelectableBook {
  return {
    id: book.id,
    title: book.title,
    slug: book.slug,
    coverUrl: book.coverUrl,
    authorName: book.authorName,
  };
}

export default function BookSelector({
  value,
  onChange,
  disabled = false,
  placeholder = 'Chọn sách...',
}: BookSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: libraryData, isLoading } = useQuery({
    ...libraryQueries.books({ status: 'READING,COMPLETED' }),
  });

  const books = useMemo(() =>
    (libraryData?.map(item => toSelectable(item.bookId)) || []),
    [libraryData]
  );

  const selectedBook = books.find((book) => book.id === value);
  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.authorName.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleSelect = (book: SelectableBook) => {
    onChange(book.id, book);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div
        onClick={() => { if (!disabled) setIsOpen(prev => !prev); }}
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
                <SafeImage
                  src={selectedBook.coverUrl}
                  alt={selectedBook.title}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-foreground text-[13px] truncate">
                  {selectedBook.title}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {selectedBook.authorName}
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

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-popover text-popover-foreground border border-border rounded-2xl shadow-2xl max-h-[28rem] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
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

          {isLoading && books.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!isLoading || books.length > 0 ? (
            <div className="overflow-y-auto flex-1 thin-scrollbar p-2">
              {filteredBooks.length > 0 ? (
                <div className="space-y-1">
                  {filteredBooks.map((book) => (
                    <button
                      key={book.id}
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
                        <SafeImage
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
                          {book.authorName}
                        </p>
                      </div>
                      {book.id === value && (
                        <div className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-[10px] font-bold">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
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
