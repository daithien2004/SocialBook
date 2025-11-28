'use client';

import { Book } from '@/src/features/books/types/book.interface';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect, ElementType } from 'react';
import { BookCard } from './BookCard';

interface BookSectionProps {
  title?: string;
  books: Book[];
  description?: string;
  icon?: ElementType;
}

export function BookSection({
  title,
  books,
  icon: IconComponent,
}: BookSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const container = containerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 2);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 2
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
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!books || books.length === 0) return null;

  return (
    <section className="w-full group/section py-4">
      <div className="flex items-center justify-between px-4 md:px-12 mb-4">
        {title && (
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-wide flex items-center gap-2 transition-colors duration-300">
            {IconComponent && (
              <IconComponent
                size={24}
                className="text-red-600 dark:text-red-500"
              />
            )}
            {title}
          </h2>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-1.5 rounded-full border border-gray-300 dark:border-white/20 hover:border-red-600 dark:hover:border-white hover:bg-red-50 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-all duration-300 ${
              !canScrollLeft ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-1.5 rounded-full border border-gray-300 dark:border-white/20 hover:border-red-600 dark:hover:border-white hover:bg-red-50 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-all duration-300 ${
              !canScrollRight ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="relative group">
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-4 pt-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {books.map((book) => (
            <div key={book.id} className="flex-none w-[160px] md:w-[200px]">
              <BookCard book={book} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
