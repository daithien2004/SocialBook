'use client';

import { useGetPersonalizedRecommendationsQuery } from '@/src/features/recommendations/api/recommendationsApi';
import { Sparkles, ChevronRight, LogIn } from 'lucide-react';
import { useAppAuth } from '@/src/hooks/useAppAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export const RecommendedForYouSection = () => {
  const { isAuthenticated, isGuest } = useAppAuth();
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const limit = 12;

  const { data, isLoading, error } = useGetPersonalizedRecommendationsQuery(
    { page: 1, limit },
    { skip: !isAuthenticated }
  );

  // Chưa đăng nhập
  if (isGuest) {
    return (
      <section className="mb-12">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-white/10 p-8 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-blue-600 dark:text-blue-400" size={24} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gợi ý cho bạn
            </h2>
          </div>

          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
              <LogIn size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Đăng nhập để nhận gợi ý cá nhân hóa
            </h3>
            <p className="text-base text-gray-500 dark:text-gray-400 mb-6 max-w-md">
              Khám phá những cuốn sách phù hợp với sở thích của bạn dựa trên
              lịch sử đọc và đánh giá
            </p>
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
            >
              Đăng nhập ngay
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-blue-600 dark:text-blue-400" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gợi ý cho bạn
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 p-2">
              <div className="w-16 h-24 bg-gray-200 dark:bg-white/5 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-12">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            Không thể tải đề xuất
          </p>
          <p className="text-blue-500 dark:text-blue-300 text-sm">
            Đã có lỗi xảy ra. Vui lòng thử lại sau.
          </p>
        </div>
      </section>
    );
  }

  if (!data?.recommendations || data.recommendations.length === 0) {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-blue-600 dark:text-blue-400" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gợi ý cho bạn
          </h2>
        </div>
        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
            Chưa có gợi ý
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            Đọc thêm sách để nhận gợi ý!
          </p>
        </div>
      </section>
    );
  }

  // Hiển thị đúng số lượng từ API (limit)
  const displayedBooks = data.recommendations;

  return (
    <section className="mb-12">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="text-blue-600 dark:text-blue-400" size={24} />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gợi ý cho bạn
        </h2>
      </div>

      {/* Books List - Single Column */}
      <div className="flex flex-col gap-3">
        {displayedBooks.map((rec) => (
          <div
            key={rec.bookId}
            className="relative"
            onMouseEnter={() => setHoveredId(rec.bookId)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <button
              onClick={() => router.push(`/books/${rec.book.slug}`)}
              className="flex gap-3 w-full text-left hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg p-2 transition-all duration-200 group"
            >
              {/* Book Cover */}
              <div className="relative w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                {rec.book.coverUrl ? (
                  <Image
                    src={rec.book.coverUrl}
                    alt={rec.book.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800" />
                )}
                {rec.matchScore && (
                  <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                    {rec.matchScore}%
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="flex-1 min-w-0 flex flex-col">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                  {rec.book.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  {rec.book.authorId?.name || 'Unknown Author'}
                </p>
              </div>
            </button>

            {/* Tooltip */}
            {hoveredId === rec.bookId && rec.reason && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none">
                {rec.reason}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900 dark:border-t-gray-800" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
