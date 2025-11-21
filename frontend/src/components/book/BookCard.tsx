import { Book } from '@/src/features/books/types/book.interface';
import { Eye, Heart, Star, Clock } from 'lucide-react';
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
      <div className="group bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
        {/* Book Cover */}
        <div className="relative aspect-[2/3] overflow-hidden bg-gray-100">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badges - Top Right */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {isNew() && (
              <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded">
                MỚI
              </span>
            )}
            {isTrending && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                HOT
              </span>
            )}
            {book.status === 'completed' && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded">
                FULL
              </span>
            )}
          </div>

          {/* Rating Badge - Top Left */}
          {ratingNum > 0 && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-yellow-400 rounded shadow-sm">
              <Star size={12} className="fill-white text-white" />
              <span className="text-white font-bold text-xs">{rating}</span>
            </div>
          )}
        </div>

        {/* Info Section - Always Visible */}
        <div className="p-3">
          {/* Title */}
          <h3 className="font-bold text-base text-gray-900 mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {book.title}
          </h3>

          {/* Author */}
          <p className="text-sm text-gray-600 mb-2.5">{book.authorId.name}</p>

          {/* Genres */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {book.genres.slice(0, 2).map((g) => (
              <span
                key={g.id}
                className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {g.name}
              </span>
            ))}
            {book.genres.length > 2 && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{book.genres.length - 2}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <Eye size={12} />
              <span>{formatNumber(book.views)}</span>
            </div>

            <div className="flex items-center gap-1">
              <Heart size={12} className="fill-red-400 text-red-400" />
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
