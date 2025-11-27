'use client';

import { ChevronLeft, ChevronRight, Eye, Heart, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Book } from '@/src/features/books/types/book.interface';
import Link from 'next/link';
import { formatCompact } from '@/lib/utils';

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
    <section className="relative w-full h-[650px] md:h-[700px] bg-transparent overflow-hidden shadow-2xl">
      {/* Gradient Overlay - adapts to theme */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-100 via-gray-100/50 dark:from-[#000000] dark:via-black/50 to-transparent transition-colors duration-300"></div>

      <div className="relative z-10 h-full flex items-center justify-between px-6 md:px-12 lg:px-20">
        {/* Book Cover */}
        <div className="hidden md:block w-[280px] h-[420px] lg:w-[320px] lg:h-[480px] flex-shrink-0 mr-8 relative">
          <img
            src={currentBook.coverUrl}
            alt={currentBook.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 rounded-md shadow-2xl"
          />
        </div>

        {/* Book Info */}
        <div className="flex-1 max-w-2xl text-gray-900 dark:text-white pt-10 md:pt-0 transition-colors duration-300">
          {/* Year */}
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 drop-shadow-md transition-colors duration-300">
            {new Date(currentBook.createdAt).getFullYear()}
          </p>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 drop-shadow-xl text-gray-900 dark:text-white transition-colors duration-300">
            {currentBook.title}
          </h1>

          {/* Genres */}
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 mb-4 drop-shadow-md transition-colors duration-300">
            {currentBook.genres?.map((genre, index) => (
              <span key={genre.id}>
                {genre.name}
                {index < currentBook.genres.length - 1 && ' • '}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg line-clamp-3 mb-6 max-w-xl drop-shadow-md transition-colors duration-300">
            {currentBook.description ||
              `Khám phá câu chuyện hấp dẫn về ${currentBook.title} của tác giả ${currentBook.authorId.name}. Một tác phẩm đầy kịch tính và sâu sắc, đưa bạn vào một thế giới hoàn toàn mới.`}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-8 transition-colors duration-300">
            <div className="flex items-center gap-2">
              <span className="text-white bg-red-600 px-1 py-0.5 rounded-sm text-xs font-bold">
                NEW
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={16} /> {formatCompact(currentBook.views)}
            </div>
            <div className="flex items-center gap-2">
              <Heart size={16} className="mb-[3px]" />
              {formatCompact(currentBook.likes)}
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex gap-4">
            <Link href={`/books/${currentBook.slug}`} className="group">
              <button className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-white/20 dark:hover:bg-red-700 text-white font-bold text-lg rounded-full transition-all duration-300 drop-shadow-lg">
                <BookOpen size={20} fill="white" /> Đọc Ngay
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* NAVIGATION ARROWS */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 px-2 flex justify-between z-30 pointer-events-none">
        <button
          onClick={handlePrev}
          className="pointer-events-auto p-1 bg-gray-800/30 hover:bg-gray-800/50 dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 md:opacity-100"
          aria-label="Previous slide"
        >
          <ChevronLeft size={30} />
        </button>
        <button
          onClick={handleNext}
          className="pointer-events-auto p-1 bg-gray-800/30 hover:bg-gray-800/50 dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 md:opacity-100"
          aria-label="Next slide"
        >
          <ChevronRight size={30} />
        </button>
      </div>

      {/* SLIDE INDICATORS */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {books.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-red-600 dark:bg-white scale-125'
                : 'bg-gray-400 dark:bg-gray-600 hover:bg-red-400 dark:hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
