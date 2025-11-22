import { Book } from '@/src/features/books/types/book.interface';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { BookCard } from './BookCard';

interface BookSectionProps {
  title: string;
  books: Book[];
  // Loại bỏ icon và iconColor để đúng style tối giản của ảnh
}

export function BookSection({ title, books }: BookSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const container = containerRef.current;
    if (container) {
      // Cho phép sai số 10px để tránh lỗi làm tròn số trên một số màn hình
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
      // Scroll khoảng 1/2 chiều rộng màn hình hoặc cố định
      const scrollAmount =
        direction === 'left'
          ? -(container.clientWidth / 2)
          : container.clientWidth / 2;

      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!books || books.length === 0) return null;

  return (
    <section className="py-2  border-b border-gray-100/50">
      {/* 1. Header Section: Minimal & Centered */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a1a1a] relative inline-block">
          {title}
          {/* Đường gạch chân trang trí nhỏ (optional) */}
          {/* <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-200 rounded-full"></span> */}
        </h2>
      </div>

      {/* 2. Books Container Wrapper */}
      <div className="relative group px-4 md:px-8">
        {/* Left Navigation Button - Floating */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm border border-gray-200 p-3 rounded-full shadow-lg text-gray-800 hover:bg-gray-50 hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 translate-x-[-50%] md:translate-x-0"
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
        )}

        {/* Right Navigation Button - Floating */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm border border-gray-200 p-3 rounded-full shadow-lg text-gray-800 hover:bg-gray-50 hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 translate-x-[50%] md:translate-x-0"
            aria-label="Scroll right"
          >
            <ChevronRight size={24} strokeWidth={1.5} />
          </button>
        )}

        {/* Scrollable Area */}
        <div
          ref={containerRef}
          className="flex gap-6 md:gap-8 overflow-x-auto pb-8 pt-2 px-2 scrollbar-hide scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {books.map((book) => (
            // Định chiều rộng cố định cho card để đảm bảo đều nhau
            <div key={book.id} className="flex-none w-[200px] md:w-[240px]">
              <BookCard book={book} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
