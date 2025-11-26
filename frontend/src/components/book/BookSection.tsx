import { Book } from '@/src/features/books/types/book.interface';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { BookCard } from './BookCard';

interface BookSectionProps {
  title: string;
  books: Book[];
  description?: string;
  icon?: React.ReactNode;
}

export function BookSection({ title, books, description, icon }: BookSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const container = containerRef.current;
    if (container) {
      // Cho phép sai số 10px để tránh lỗi làm tròn số trên một số màn hình
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      // Check ngay lần đầu mount
      checkScroll();
      // Check lại khi window resize
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

  // Default icon nếu không được truyền vào
  const defaultIcon = (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M12 6v7" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 9l3-3 3 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
  );

  return (
      <section className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="w-12 h-12 bg-[#2d8653] rounded-lg flex items-center justify-center flex-shrink-0">
              {icon || defaultIcon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#333333]">{title}</h2>
              {description && (
                  <p className="text-[#888888] text-sm mt-1">
                    {description}
                  </p>
              )}
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`w-10 h-10 rounded-full border border-[#e0e0e0] flex items-center justify-center hover:bg-[#f5f5f5] transition-colors ${
                    !canScrollLeft ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-[#666666]" />
            </button>
            <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`w-10 h-10 rounded-full border border-[#e0e0e0] flex items-center justify-center hover:bg-[#f5f5f5] transition-colors ${
                    !canScrollRight ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-[#666666]" />
            </button>
          </div>
        </div>

        {/* Books Carousel */}
        <div
            ref={containerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
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
        </div>
      </section>
  );
}