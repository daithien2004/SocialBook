'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetPersonalizedRecommendationsQuery } from '@/features/recommendations/api/recommendationsApi';
import { useAppAuth } from '@/hooks/useAppAuth';
import { ChevronRight, LogIn, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
        <Card className="border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none transition-colors duration-300">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="text-blue-600 dark:text-blue-400" size={24} />
              Gợi ý cho bạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                <LogIn size={32} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Đăng nhập để nhận gợi ý cá nhân hóa
              </h3>
              <p className="text-base text-muted-foreground mb-6 max-w-md">
                Khám phá những cuốn sách phù hợp với sở thích của bạn dựa trên
                lịch sử đọc và đánh giá
              </p>
              <Button asChild className="rounded-full shadow-md hover:shadow-lg bg-blue-600 hover:bg-blue-700 px-8 py-6 text-base">
                <Link href="/login" className="flex items-center gap-2">
                  Đăng nhập ngay
                  <ChevronRight size={18} />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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
        <Card className="border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-4">
          <div className="flex flex-col gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3 p-2">
                <div className="w-16 h-24 bg-gray-200 dark:bg-accent/10 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-accent/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-accent/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </Card>
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
        <Card className="bg-gray-50 dark:bg-accent/5 border border-gray-200 dark:border-white/10 rounded-lg p-8 text-center">
          <p className="text-muted-foreground font-medium mb-1">
            Chưa có gợi ý
          </p>
          <p className="text-muted-foreground text-sm">
            Đọc thêm sách để nhận gợi ý!
          </p>
        </Card>
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
            <Button
              variant="ghost"
              onClick={() => router.push(`/books/${rec.book.slug}`)}
              className="flex gap-3 w-full h-auto text-left hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg p-2 transition-all duration-200 group justify-start items-start"
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
              <div className="flex-1 min-w-0 flex flex-col pt-1">
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1 break-words whitespace-normal text-left">
                  {rec.book.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {rec.book.authorId?.name || 'Unknown Author'}
                </p>
              </div>
            </Button>

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
