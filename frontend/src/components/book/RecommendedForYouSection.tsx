'use client';

import { useGetPersonalizedRecommendationsQuery } from '@/src/features/recommendations/api/recommendationsApi';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';

export const RecommendedForYouSection = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const limit = 12;

  const { data, isLoading, error } = useGetPersonalizedRecommendationsQuery(
    { page: 1, limit },
    {
      skip: status !== 'authenticated',
    }
  );

  if (status !== 'authenticated') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-[#161515]/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-red-600 dark:text-red-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">
            Gợi ý cho bạn
          </h3>
        </div>

        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h3 className="font-semibold text-red-900 dark:text-red-200 text-sm">
            Không thể tải đề xuất
          </h3>
        </div>
        <p className="text-xs text-red-700 dark:text-red-300">
          Đã có lỗi xảy ra. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  if (!data?.recommendations || data.recommendations.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-[#161515]/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-red-600 dark:text-red-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">
            Gợi ý cho bạn
          </h3>
        </div>

        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <Sparkles className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Chưa có gợi ý
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Đọc thêm sách để nhận gợi ý!
          </p>
        </div>
      </div>
    );
  }

  // Sắp xếp theo matchScore (cao xuống thấp)
  const sortedRecommendations = [...data.recommendations].sort((a, b) => {
    const scoreA = a.matchScore || 0;
    const scoreB = b.matchScore || 0;
    return scoreB - scoreA;
  });

  const displayedBooks = sortedRecommendations.slice(0, 12);

  return (
    <div className="bg-white/80 dark:bg-[#161515]/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-red-600 dark:text-red-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">
            Gợi ý cho bạn
          </h3>
        </div>
      </div>

      {/* Books List */}
      <div className="space-y-2 mb-4">
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
              <div className="relative w-14 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-md group-hover:shadow-lg transition-shadow">
                {rec.book.coverUrl ? (
                  <Image
                    src={rec.book.coverUrl}
                    alt={rec.book.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                )}
                {rec.matchScore && (
                  <div className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                    {rec.matchScore}%
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                  {rec.book.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  {rec.book.authorId?.name || 'Unknown Author'}
                </p>
              </div>
            </button>

            {/* Tooltip */}
            {hoveredId === rec.bookId && rec.reason && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{rec.reason}</p>
                </div>
                {/* Arrow */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 border-l border-t border-gray-700 rotate-45" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* View All Button */}
      <button
        onClick={() => router.push('/recommendations')}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-all duration-300 hover:shadow-md"
      >
        Xem tất cả
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
