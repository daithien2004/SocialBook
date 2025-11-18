import { Book } from '@/src/features/books/types/book.interface';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { BookCard } from './BookCard';

export function BookSection({
  title,
  icon: Icon,
  books,
  iconColor,
}: {
  title: string;
  icon: any;
  books: Book[];
  iconColor: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const container = containerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft <
          container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      checkScroll();
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [books]);

  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-16">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${iconColor} text-white shadow-md`}>
            <Icon size={28} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-2.5 rounded-lg transition-colors ${
              canScrollLeft
                ? 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-2.5 rounded-lg transition-colors ${
              canScrollRight
                ? 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Books Container */}
      <div className="relative">
        {/* Gradient Overlays - Chỉ hiện khi cần */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        )}

        {/* Scrollable Books */}
        <div
          ref={containerRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth px-2 py-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {books.map((book) => (
            <div key={book.id} className="flex-none w-[200px]">
              <BookCard book={book} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
