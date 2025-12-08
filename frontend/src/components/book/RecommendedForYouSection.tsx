'use client';

import { useGetPersonalizedRecommendationsQuery } from '@/src/features/recommendations/api/recommendationsApi';
import { Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RecommendedBookCard } from './RecommendedBookCard';

export const RecommendedForYouSection = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 12;

  const { data, isLoading, error } = useGetPersonalizedRecommendationsQuery(
    { page: currentPage, limit },
    {
      skip: status !== 'authenticated',
    }
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (status !== 'authenticated') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-red-600 dark:text-red-500" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-wide">
                Gợi ý cho bạn
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Đang phân tích sở thích của bạn...
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-12 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h3 className="font-semibold text-red-900 dark:text-red-200">
            Không thể tải đề xuất
          </h3>
        </div>
        <p className="text-sm text-red-700 dark:text-red-300">
          Đã có lỗi xảy ra khi tải sách đề xuất. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  if (!data?.recommendations || data.recommendations.length === 0) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-red-600 dark:text-red-500" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-wide">
                Gợi ý cho bạn
              </h2>
            </div>
          </div>
        </div>

        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Chúng tôi cần thêm thông tin để đề xuất sách cho bạn
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Hãy đọc và đánh giá thêm sách để nhận gợi ý phù hợp hơn!
          </p>
        </div>
      </div>
    );
  }

  const { pagination } = data;

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-red-600 dark:text-red-500" />
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-wide">
              Gợi ý cho bạn
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {pagination.totalItems} cuốn sách dành riêng cho bạn
            </p>
          </div>
        </div>

        {/* Desktop View All Button */}
        <button
          onClick={() => router.push('/recommendations')}
          className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all duration-300"
          aria-label="View all recommendations"
        >
          Xem tất cả
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {data.recommendations.map((rec) => (
          <RecommendedBookCard
            key={rec.bookId}
            book={rec.book}
            matchScore={rec.matchScore}
            reason={rec.reason}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Trước</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show first page, last page, current page, and pages around current
                return (
                  page === 1 ||
                  page === pagination.totalPages ||
                  Math.abs(page - currentPage) <= 1
                );
              })
              .map((page, index, array) => {
                // Add ellipsis
                const prevPage = array[index - 1];
                const showEllipsis = prevPage && page - prevPage > 1;

                return (
                  <div key={page} className="flex items-center gap-1">
                    {showEllipsis && (
                      <span className="px-2 text-gray-500 dark:text-gray-400">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[40px] h-10 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
                        page === currentPage
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      aria-label={`Go to page ${page}`}
                      aria-current={page === currentPage ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  </div>
                );
              })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile View All Button */}
      <button
        onClick={() => router.push('/recommendations')}
        className="md:hidden w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-md transition-all duration-300"
        aria-label="View all recommendations"
      >
        Xem tất cả gợi ý
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
