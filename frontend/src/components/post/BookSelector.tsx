'use client';

import { useState, useRef, useEffect } from 'react';
import { useGetBooksQuery } from '@/src/features/books/api/bookApi';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: books = [], isLoading, error } = useGetBooksQuery();

  const selectedBook = books.find((book) => book.id === value);

  const filteredBooks = books.filter(
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

  const handleSelect = (book: Book) => {
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
        {/* Selected Value Display */}
        <div
            onClick={() => !disabled && setIsOpen(!isOpen)}
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
            <div
                className="
              absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl
              max-h-[min(60vh,20rem)] overflow-hidden flex flex-col pb-2
            "
            >
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

              {/* Loading State */}
              {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                  </div>
              )}

              {/* Error State */}
              {error && (
                  <div className="p-4 text-center text-red-600 text-sm">
                    Lỗi khi tải danh sách sách
                  </div>
              )}

              {/* Books List */}
              {!isLoading && !error && (
                  <div className="max-h-64 overflow-y-auto thin-scrollbar pb-1 pr-1">
                    {filteredBooks.length > 0 ? (
                        filteredBooks.map((book) => (
                            <button
                                key={book.id}
                                type="button"
                                onClick={() => handleSelect(book)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                    book.id === value
                                        ? 'bg-sky-50'
                                        : 'hover:bg-slate-50'
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
                        ))
                    ) : (
                        <div className="px-4 py-8 text-center text-xs sm:text-sm text-slate-500">
                          {searchQuery
                              ? 'Không tìm thấy sách nào'
                              : 'Chưa có sách nào'}
                        </div>
                    )}
                  </div>
              )}
            </div>
        )}
      </div>
  );
}
