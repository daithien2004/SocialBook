import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Book } from '@/src/features/books/types/book.interface';
import Link from 'next/link';

interface BannerSliderProps {
  books: Book[];
}

export function BannerSlider({ books }: BannerSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(2);

  // Responsive logic
  useEffect(() => {
    const handleResize = () => {
      setItemsPerSlide(window.innerWidth < 768 ? 1 : 2);
    };

    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const totalPages = Math.ceil(books.length / itemsPerSlide);

  useEffect(() => {
    setCurrentSlide(0);
  }, [itemsPerSlide]);

  useEffect(() => {
    if (books.length === 0) return;
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [books.length, totalPages, currentSlide]);

  if (books.length === 0) return null;

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalPages);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <section className="w-full bg-[#111111] py-16 px-4 lg:px-12 mb-0 relative group border-b border-gray-800 mt-8">
      {/* Label trang trí */}
      <div className="absolute top-6 left-4 lg:left-12 flex items-center gap-2">
        <div className="w-2 h-2 bg-white"></div>
        <span className="text-white font-mono text-xs uppercase tracking-[0.2em]">
          Featured Selection
        </span>
      </div>

      {/* Main Slider Track */}
      <div className="overflow-hidden w-full mt-4">
        <div
          className="flex transition-transform duration-700 cubic-bezier(0.22, 1, 0.36, 1) gap-6"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {books.map((book) => (
            <div
              key={book.id}
              className="min-w-full md:min-w-[calc(50%-12px)] flex-shrink-0"
            >
              <div className="bg-white h-[350px] md:h-[380px] flex w-full relative group/card border border-white/10">
                {/* Cột nội dung (Text) */}
                <div className="w-1/2 p-6 md:p-10 flex flex-col justify-between bg-white z-10 border-r border-gray-100">
                  <div>
                    {/* Meta Label */}
                    <div className="inline-flex items-center gap-2 border-b border-gray-200 pb-2 mb-4">
                      <span className="text-[10px] font-mono font-bold text-black uppercase tracking-widest">
                        {book.genres?.[0]?.name || 'NOVEL'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        // VOL.{book.stats?.chapters || 1}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 leading-[1.1] mb-2 line-clamp-3 group-hover/card:underline decoration-1 underline-offset-4">
                      {book.title}
                    </h3>

                    {/* Author */}
                    <p className="text-xs font-mono text-gray-500 uppercase tracking-wide mt-2">
                      BY {book.authorId.name}
                    </p>
                  </div>

                  {/* Button */}
                  <Link
                    href={`/books/${book.slug}`}
                    className="inline-block mt-4"
                  >
                    <button className="group/btn flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-black transition-all hover:gap-4">
                      Read Now
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:-rotate-45" />
                    </button>
                  </Link>
                </div>

                {/* Cột ảnh (Image) */}
                <div className="w-1/2 h-full relative overflow-hidden bg-gray-100">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    // Đã bỏ saturate-0, giữ lại scale để zoom nhẹ khi hover
                    className="w-full h-full object-cover object-center transform transition-transform duration-700 scale-100 group-hover/card:scale-105"
                  />
                  {/* Overlay text decor */}
                  <div className="absolute bottom-4 right-4 text-white/90 font-mono text-[10px] z-20 hidden md:block drop-shadow-md">
                    ID: {book.id.slice(-6).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 px-2 lg:px-4 pointer-events-none flex justify-between">
        <button
          onClick={handlePrev}
          className="pointer-events-auto w-12 h-12 bg-white border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white transition-colors duration-300 disabled:opacity-50"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={handleNext}
          className="pointer-events-auto w-12 h-12 bg-white border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white transition-colors duration-300 disabled:opacity-50"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Line Indicator */}
      <div className="flex justify-center gap-1 mt-8">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-[2px] transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white w-12'
                : 'bg-gray-700 w-4 hover:bg-gray-500'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
