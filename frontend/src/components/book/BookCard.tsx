'use client';

import { Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ElementType, useEffect, useRef, useState } from 'react';

import { cn, formatCompact } from '@/lib/utils';
import AddToLibraryModal from '@/src/components/library/AddToLibraryModal';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Book } from '@/src/features/books/types/book.interface';

export function BookCard({ book }: { book: Book }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddToLibrary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <Link
        href={`/books/${book.slug}`}
        className="group relative block w-full max-w-[220px]"
      >
        <Card className="overflow-hidden border-gray-200 dark:border-white/10 transition-all duration-500 hover:border-gray-400 dark:hover:border-white/30 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] bg-card text-card-foreground">
          <div className="relative aspect-[2/3] w-full overflow-hidden">
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-full w-full object-cover opacity-90 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:contrast-125"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />

            <div className="absolute top-3 w-full text-center">
              <Badge variant="secondary" className="text-[9px] font-bold tracking-[0.3em] uppercase bg-background/80 backdrop-blur-sm border-none shadow-sm">
                {book.status === 'published' ? 'COMING SOON' : 'IN PRODUCTION'}
              </Badge>
            </div>
          </div>

          <CardContent className="flex flex-col p-4 pt-2">
            <div className="mb-1 text-center">
              <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground group-hover:text-foreground transition-colors">
                {book.authorId.name}
              </p>
            </div>

            <h3 className="mb-4 text-center text-sm font-notosans font-semibold text-foreground bg-clip-text group-hover:text-red-600 dark:group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] dark:group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all line-clamp-2">
              {book.title}
            </h3>

            <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-muted-foreground">
                <span>VOL {book.stats?.chapters || 0}</span>

                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>

                <span className="flex items-center gap-1">
                  {formatCompact(book.views)}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddToLibrary}
                className="h-8 w-8 text-muted-foreground hover:text-red-600 dark:hover:text-white hover:bg-transparent"
                title="Save to Library"
              >
                <Bookmark
                  size={16}
                  className="transition-transform hover:scale-110"
                  fill={isModalOpen ? 'currentColor' : 'none'}
                />
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>

      <AddToLibraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookId={book.id}
      />
    </>
  );
}

// BookSection Component with Dark Mode Support
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
          <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-wide flex items-center gap-2 transition-colors duration-300">
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              "rounded-full border-gray-300 dark:border-white/20 hover:border-red-600 dark:hover:border-white hover:bg-red-50 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-all duration-300",
              !canScrollLeft && "opacity-30 cursor-not-allowed"
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              "rounded-full border-gray-300 dark:border-white/20 hover:border-red-600 dark:hover:border-white hover:bg-red-50 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-all duration-300",
              !canScrollRight && "opacity-30 cursor-not-allowed"
            )}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </Button>
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
