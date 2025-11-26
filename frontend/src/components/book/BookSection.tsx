import { Book } from '@/src/features/books/types/book.interface';
import { ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { useRef, useState, useEffect, ElementType } from 'react';
import { BookCard } from './BookCard';

interface BookSectionProps {
  books: Book[];
  description?: string;
  icon?: ElementType;
}

export function BookSection({
  books,
  description,
  icon,
}: BookSectionProps) {
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
      window.addEventListener('resize', checkScroll);

      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [books]);

  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!books || books.length === 0) return null;

  // Icon mặc định nếu không truyền vào
  const SectionIcon = icon || Hash;

  return (
    <section className="w-full mx-auto px-4 py-8 border-t border-gray-100 first:border-t-0">
      {/* Header Area - Editorial Style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div className="flex-1">
          {/* Decorative Top Label - Mono font giống BookCard */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-gray-400">
              <SectionIcon className="w-3 h-3" />
              <span>Collection</span>
            </div>
          </div>

          {description && (
            <p className="text-gray-500 text-sm mt-2 max-w-2xl font-light leading-relaxed border-l-2 border-gray-200 pl-3 ml-1">
              {description}
            </p>
          )}
        </div>

        {/* Navigation Arrows - Square & Sharp */}
        <div className="flex items-center gap-0 border border-gray-200 bg-white">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border-r border-gray-200
              ${
                !canScrollLeft
                  ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                  : 'text-gray-600 hover:bg-black hover:text-white'
              }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`w-10 h-10 flex items-center justify-center transition-all duration-200
              ${
                !canScrollRight
                  ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                  : 'text-gray-600 hover:bg-black hover:text-white'
              }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Books Carousel */}
      <div className="relative">
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-1" // pb-1 để tránh shadow bị cắt nếu có
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {books.map((book) => (
            <div key={book.id} className="flex-none">
              <BookCard book={book} />
            </div>
          ))}

          {/* Padding right ảo để card cuối không bị dính lề màn hình */}
          <div className="w-1 flex-none" />
        </div>
      </div>
    </section>
  );
}
