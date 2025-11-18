import { Book } from '@/src/features/books/types/book.interface';
import { Eye, Heart, Star } from 'lucide-react';
import Link from 'next/link';

export function BookCard({ book }: { book: Book }) {
  // Kiểm tra xem sách có mới không (trong vòng 30 ngày)
  const isNew = () => {
    const bookDate = new Date(book.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - bookDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  // Kiểm tra xem sách có trending không (views > 2000)
  const isTrending = book.views > 2000;

  // Tính rating từ likes và views
  const rating =
    book.views > 0 ? ((book.likes / book.views) * 5).toFixed(1) : '0.0';

  const ratingNum = parseFloat(rating);

  return (
    <Link href={`/books/${book.slug}`}>
      <div className="group relative bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
        {/* Badges - Đơn giản */}
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5">
          {isNew() && (
            <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-md shadow-sm">
              MỚI
            </span>
          )}
          {isTrending && (
            <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-md shadow-sm">
              HOT
            </span>
          )}
          {book.status === 'completed' && (
            <span className="px-2.5 py-1 bg-blue-500 text-white text-xs font-bold rounded-md shadow-sm">
              HOÀN
            </span>
          )}
        </div>

        {/* Book Cover */}
        <div className="relative aspect-[2/3] overflow-hidden bg-gray-100">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Overlay đơn giản */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Rating */}
          {ratingNum > 0 && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-yellow-400 rounded-md shadow-sm">
              <Star size={12} className="fill-white text-white" />
              <span className="text-white font-bold text-xs">{rating}</span>
            </div>
          )}
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Genres */}
          <div className="mb-2 flex flex-wrap gap-1">
            {book.genres.slice(0, 2).map((g) => (
              <span
                key={g.id}
                className="px-2 py-0.5 bg-white/20 text-xs rounded"
              >
                {g.name}
              </span>
            ))}
          </div>

          {/* Title & Author */}
          <h3 className="font-bold text-base mb-1 line-clamp-2">
            {book.title}
          </h3>
          <p className="text-sm opacity-90 mb-2">{book.author.name}</p>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Eye size={14} />
              <span>{formatNumber(book.views)}</span>
            </div>

            <div className="flex items-center gap-1">
              <Heart size={14} className="fill-current" />
              <span>{formatNumber(book.likes)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Helper function để format số
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
