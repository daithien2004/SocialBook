import { ChevronLeft, ChevronRight, Eye, Heart, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Book } from '@/src/features/books/types/book.interface';
import Link from 'next/link';

interface BannerSliderProps {
  books: Book[];
}

export function BannerSlider({ books }: BannerSliderProps) {
  console.log(books);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (books.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % books.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [books.length]);

  if (books.length === 0) {
    return null;
  }

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % books.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + books.length) % books.length);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getRating = (book: Book) => {
    return book.views > 0 ? ((book.likes / book.views) * 5).toFixed(1) : '0.0';
  };

  return (
    <div className="relative w-full h-[420px] overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg mb-8">
      {books.map((book, index) => (
        <div
          key={book.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover opacity-20 blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-900/80" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center">
            <div className="container mx-auto px-8 lg:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left: Book Cover */}
                <div className="flex justify-center lg:justify-start">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="relative w-64 h-96 object-cover rounded-lg shadow-2xl"
                    />
                    {/* NEW Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded shadow-lg">
                        MỚI
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Book Info */}
                <div className="text-white space-y-4">
                  <div className="inline-block px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-sm font-medium mb-2">
                    Sách Mới Nhất
                  </div>

                  <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-3">
                    {book.title}
                  </h2>

                  <p className="text-xl text-gray-300 mb-4">
                    Tác giả: {book.author.name}
                  </p>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {book.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Star
                        size={16}
                        className="fill-yellow-400 text-yellow-400"
                      />
                      <span className="font-semibold">{getRating(book)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye size={16} />
                      <span>{formatNumber(book.views)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart size={16} className="fill-red-400 text-red-400" />
                      <span>{formatNumber(book.likes)}</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link href={`/books/${book.slug}`}>
                    <button className="mt-6 px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                      Đọc Ngay
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-2.5 rounded-lg transition-all border border-white/20"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-2.5 rounded-lg transition-all border border-white/20"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {books.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-white w-8'
                : 'bg-white/40 w-1.5 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
