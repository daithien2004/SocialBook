'use client';

import { Search, BookOpen, ArrowRight, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, startTransition } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useLazyGetBooksQuery } from '@/features/books/api/bookApi';

export function SearchTrigger() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const isComposing = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [triggerSearch, { data: searchData, isLoading, isFetching }] =
    useLazyGetBooksQuery();

  useEffect(() => {
    if (isComposing.current) return;
    const trimmed = debouncedQuery.trim();
    if (trimmed.length >= 1) {
      triggerSearch({ search: trimmed, page: 1, limit: 5 });
      startTransition(() => setIsOpen(true));
    } else {
      startTransition(() => setIsOpen(false));
    }
  }, [debouncedQuery, triggerSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>,
  ) => {
    isComposing.current = false;
    setQuery(e.currentTarget.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setIsOpen(false);
      router.push(`/books?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleResultClick = (slug: string) => {
    setIsOpen(false);
    router.push(`/books/${slug}`);
  };

  const handleViewAll = () => {
    const trimmed = query.trim();
    if (trimmed) {
      setIsOpen(false);
      router.push(`/books?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const books = searchData?.data ?? [];
  const isLoadingResults = isLoading || isFetching;

  return (
    <div ref={containerRef} className="relative hidden lg:block">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onFocus={() => {
              if (query.trim().length >= 1) setIsOpen(true);
            }}
            placeholder="Tìm sách..."
            className={`w-44 xl:w-56 pl-9 pr-8 py-2 text-sm rounded-full border transition-all ${
              isOpen
                ? 'border-brand/30 bg-background ring-2 ring-brand/20'
                : 'border-border/50 bg-muted/50'
            } text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:bg-background`}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>
 
      {isOpen && (
        <div
          className="absolute top-full right-0 lg:left-0 lg:right-auto mt-2 w-[360px] bg-background border border-border/60 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          style={
            {
              '--tw-enter-opacity': '0',
              '--tw-enter-translate-y': '-4px',
            } as React.CSSProperties
          }
        >
          {isLoadingResults ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand border-t-transparent" />
              <span className="text-xs text-muted-foreground">
                Đang tìm kiếm...
              </span>
            </div>
          ) : books.length > 0 ? (
            <>
              <div className="px-4 pt-3 pb-1.5 flex items-center gap-1.5">
                <BookOpen size={12} className="text-muted-foreground" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Sách
                </span>
              </div>
              <ul className="pb-1">
                {books.map((book, i) => (
                  <li key={book.id}>
                    {i > 0 && (
                      <div className="mx-4 border-t border-border/40" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleResultClick(book.slug)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand/10 transition-colors text-left group"
                    >
                      <div className="relative w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-gradient-to-b from-muted to-muted/50 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                        {book.coverUrl && (
                          <Image
                            src={book.coverUrl}
                            alt={book.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-brand transition-colors">
                          {book.title}
                        </p>
                        <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
                          {book.authorId?.name ?? ''}
                        </p>
                      </div>
                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
                        <ArrowRight
                          size={16}
                          className="text-brand"
                        />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 gap-2">
              <div className="p-2.5 rounded-full bg-muted/50">
                <Search
                  size={18}
                  className="text-muted-foreground/60"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Không tìm thấy kết quả
              </p>
              <p className="text-xs text-muted-foreground/60">
                Thử thay đổi từ khóa tìm kiếm
              </p>
            </div>
          )}
 
          {query.trim().length >= 1 && (
            <div className="border-t border-border/60">
              <button
                type="button"
                onClick={handleViewAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-brand hover:bg-brand/10 transition-colors"
              >
                <Search size={14} />
                Xem tất cả kết quả &quot;{query}&quot;
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
