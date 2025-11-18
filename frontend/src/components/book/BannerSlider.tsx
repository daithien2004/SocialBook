import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

// Định nghĩa dữ liệu banner slides
const bannerSlides = [
  {
    id: '1',
    title: 'Khám Phá Kho Tàng Văn Học Việt Nam',
    subtitle: 'Hàng nghìn tác phẩm kinh điển và hiện đại',
    color: 'from-purple-600 to-blue-600',
  },
  {
    id: '2',
    title: 'Truyện Kiều - Kiệt Tác Bất Hủ',
    subtitle: 'Đắm mình trong thế giới thơ Nguyễn Du',
    color: 'from-pink-600 to-red-600',
  },
  {
    id: '3',
    title: 'Văn Học Thiếu Nhi',
    subtitle: 'Nuôi dưỡng tâm hồn trẻ thơ',
    color: 'from-green-600 to-teal-600',
  },
  {
    id: '4',
    title: 'Truyện Ngắn Hiện Thực',
    subtitle: 'Phản ánh cuộc sống đời thường',
    color: 'from-orange-600 to-yellow-600',
  },
];

export function BannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  const prevSlide = () =>
    setCurrentSlide(
      (prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length
    );

  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-2xl shadow-2xl mb-12">
      {bannerSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className={`w-full h-full bg-gradient-to-r ${slide.color} flex items-center justify-center`}
          >
            <div className="text-center text-white px-8">
              <h2 className="text-5xl font-bold mb-4">{slide.title}</h2>
              <p className="text-xl opacity-90">{slide.subtitle}</p>
              <button className="mt-8 px-8 py-3 bg-white text-gray-800 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                Khám Phá Ngay
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {bannerSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
