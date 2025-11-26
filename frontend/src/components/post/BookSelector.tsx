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

  // Find selected book
  const selectedBook = books.find((book) => book.id === value);

  // Filter books by search query
  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.authorId.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
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
        role="button" // Giúp trình duyệt hiểu đây là nút bấm
        tabIndex={disabled ? -1 : 0} // Giúp có thể focus bằng bàn phím
        className={`w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between transition-colors ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed pointer-events-none'
            : 'bg-white cursor-pointer hover:border-blue-400'
        }`}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {selectedBook ? (
            <>
              <img
                src={selectedBook.coverUrl}
                alt={selectedBook.title}
                className="w-8 h-10 object-cover rounded flex-shrink-0"
              />
              <div className="text-left flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {selectedBook.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {selectedBook.authorId.name}
                </p>
              </div>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center space-x-1 flex-shrink-0">
          {selectedBook && !disabled && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded transition"
              type="button"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-lg max-h-96 overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sách..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
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
            <div className="max-h-80 overflow-y-auto">
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => handleSelect(book)}
                    className={`w-full flex items-center space-x-3 p-3 hover:bg-blue-50 transition text-left ${
                      book.id === value ? 'bg-blue-50' : ''
                    }`}
                  >
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-10 h-14 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {book.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {book.authorId.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {book.publishedYear}
                      </p>
                    </div>
                    {book.id === value && (
                      <div className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {searchQuery ? 'Không tìm thấy sách nào' : 'Chưa có sách nào'}
                </div>
              )}
            </div>
          )}

          {/* Footer Info */}
          {!isLoading && !error && filteredBooks.length > 0 && (
            <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 text-center">
              {searchQuery
                ? `${filteredBooks.length} kết quả`
                : `Tổng ${books.length} sách`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
