'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Book } from '@/features/books/types/book.interface';
import { formatCompact } from '@/lib/utils';
import { BookOpen, ChevronLeft, ChevronRight, Eye, Heart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface BannerSliderProps {
  books: Book[];
}

export function BannerSlider({ books }: BannerSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (books.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % books.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [books.length]);

  if (books.length === 0) return null;

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % books.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + books.length) % books.length);
  };

  const currentBook = books[currentSlide];

  return (
    <section className="relative w-full h-[630px] md:h-[630px] bg-transparent overflow-hidden shadow-2xl group/slider">
      <div className="absolute inset-0 bg-gradient-to-t from-gray-100 via-gray-100/50 dark:from-[#000000] dark:via-black/50 to-transparent transition-colors duration-300"></div>

      <div className="relative z-10 h-full flex items-center justify-between px-6 md:px-12 lg:px-20">
        <div className="hidden md:block w-[280px] h-[420px] lg:w-[320px] lg:h-[480px] flex-shrink-0 mr-8 relative animate-in fade-in slide-in-from-bottom-10 duration-700">
          <img
            key={currentBook.coverUrl}
            src={currentBook.coverUrl}
            alt={currentBook.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 rounded-md shadow-2xl"
          />
        </div>

        <div className="flex-1 max-w-2xl text-foreground pt-10 md:pt-0 transition-colors duration-300 animate-in fade-in slide-in-from-right-10 duration-700 delay-100">
          <p className="text-muted-foreground text-sm mb-2 drop-shadow-md transition-colors duration-300 font-medium tracking-wide">
            {new Date(currentBook.createdAt).getFullYear()}
          </p>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-notosans leading-tight mb-4 drop-shadow-xl text-foreground transition-colors duration-300">
            {currentBook.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 mb-4 drop-shadow-md transition-colors duration-300">
            {currentBook.genres?.map((genre) => (
              <Badge key={genre.id} variant="secondary" className="bg-background/50 hover:bg-background/80 backdrop-blur-sm">
                {genre.name}
              </Badge>
            ))}
          </div>

          <p className="text-muted-foreground text-base md:text-lg line-clamp-3 mb-6 max-w-xl drop-shadow-md transition-colors duration-300">
            {currentBook.description ||
              `Khám phá câu chuyện hấp dẫn về ${currentBook.title} của tác giả ${currentBook.authorId.name}. Một tác phẩm đầy kịch tính và sâu sắc, đưa bạn vào một thế giới hoàn toàn mới.`}
          </p>

          <div className="flex items-center gap-4 text-sm text-foreground/80 mb-8 transition-colors duration-300">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="rounded-sm px-1.5 py-0 text-xs font-bold">
                NEW
              </Badge>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Eye size={16} /> {formatCompact(currentBook.stats?.views || 0)}
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Heart size={16} className="mb-[3px]" />
              {formatCompact(currentBook.stats?.likes || 0)}
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full text-lg font-bold px-8 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href={`/books/${currentBook.slug}`}>
                <BookOpen size={20} className="mr-2" />
                Đọc Ngay
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 px-2 flex justify-between z-30 pointer-events-none">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          className="pointer-events-auto h-12 w-12 rounded-full border-0 bg-background/20 hover:bg-background/40 text-foreground backdrop-blur-sm shadow-lg opacity-0 group-hover/slider:opacity-100 transition-all duration-300"
          aria-label="Previous slide"
        >
          <ChevronLeft size={32} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          className="pointer-events-auto h-12 w-12 rounded-full border-0 bg-background/20 hover:bg-background/40 text-foreground backdrop-blur-sm shadow-lg opacity-0 group-hover/slider:opacity-100 transition-all duration-300"
          aria-label="Next slide"
        >
          <ChevronRight size={32} />
        </Button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {books.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
              ? 'w-8 bg-red-600 dark:bg-primary'
              : 'w-2 bg-gray-400/50 hover:bg-gray-400'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
