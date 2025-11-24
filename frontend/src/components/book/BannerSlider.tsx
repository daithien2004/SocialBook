import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Book } from '@/src/features/books/types/book.interface';
import Link from 'next/link';

interface BannerSliderProps {
  books: Book[];
}

export function BannerSlider({ books }: BannerSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(2);

  // Xử lý Responsive: 1 item trên Mobile, 2 items trên Desktop
  useEffect(() => {
    const handleResize = () => {
      // md breakpoint (768px) thường là mốc chuyển tablet/desktop
      setItemsPerSlide(window.innerWidth < 768 ? 1 : 2);
    };

    // Chạy ngay khi mount
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

  // Tính tổng số trang (slide) dựa trên số lượng item mỗi lần hiện
  const totalPages = Math.ceil(books.length / itemsPerSlide);

  // Reset về slide đầu tiên nếu số trang thay đổi (resize) để tránh lỗi
  useEffect(() => {
    setCurrentSlide(0);
  }, [itemsPerSlide]);

  // Auto slide logic
  useEffect(() => {
    if (books.length === 0) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [books.length, totalPages, currentSlide]); // Thêm dependencies

  if (books.length === 0) return null;

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalPages);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="w-full bg-[#1a1a1a] py-12 px-4 lg:px-12 mb-8 relative group">
      {/* Main Slider Track */}
      <div className="overflow-hidden w-full">
        <div
          className="flex transition-transform duration-500 ease-out gap-6"
          style={{
            // Di chuyển 100% chiều rộng container mỗi lần slide
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {books.map((book) => (
            <div
              key={book.id}
              // Mobile: 100% (1 item)
              // Desktop (md trở lên): 50% trừ đi gap (2 items)
              // gap-6 = 24px -> mỗi item trừ 12px
              className="min-w-full md:min-w-[calc(50%-12px)] flex-shrink-0"
            >
              {/* Card Style */}
              <div className="bg-white h-[280px] md:h-[320px] flex overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 relative group/card">
                {/* Cột nội dung bên trái */}
                <div className="w-1/2 p-4 md:p-8 flex flex-col justify-center z-10">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    {book.genres[0].name || 'Featured'}
                  </span>

                  <h3 className="font-serif text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
                    {book.title}
                  </h3>

                  <p className="text-sm text-gray-500 mb-4 md:mb-6 line-clamp-1">
                    {book.authorId.name}
                  </p>

                  <Link href={`/books/${book.slug}`}>
                    <button className="px-4 py-2 border border-[#ffbca0] text-[#e87b55] text-xs md:text-sm font-medium hover:bg-[#ffbca0] hover:text-white transition-colors duration-300 w-fit">
                      Đọc ngay
                    </button>
                  </Link>
                </div>

                {/* Cột ảnh bên phải */}
                <div className="w-1/2 h-full relative">
                  <div className="absolute inset-0 bg-gray-100/10 z-0"></div>
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover object-center transform group-hover/card:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white text-gray-900 p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 z-20 disabled:opacity-0"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white text-gray-900 p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 z-20 disabled:opacity-0"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots Indicator - Chỉ render số chấm bằng số trang */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white w-8'
                : 'bg-gray-600 w-1.5 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
