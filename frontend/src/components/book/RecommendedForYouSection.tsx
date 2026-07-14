'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetPersonalizedRecommendationsQuery } from '@/features/recommendations/api/recommendationsApi';
import { useAppAuth } from '@/features/auth/hooks';
import { ChevronRight, LogIn, BookOpen } from 'lucide-react';
import { SafeImage } from '../common/SafeImage';
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
      <section className="mb-0 xl:mb-12">
        <Card className="bg-transparent border border-border/50 shadow-none relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80" />
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <span className="w-1 h-3.5 bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end rounded-full shrink-0" />
              Sách hay cho bạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
                <LogIn size={28} className="text-brand" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm">
                Đăng nhập để nhận gợi ý cá nhân hóa
              </h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                Khám phá những cuốn sách phù hợp với sở thích của bạn dựa trên lịch sử đọc và đánh giá
              </p>
              <Button asChild className="rounded-full shadow-sm hover:shadow-md bg-brand hover:bg-brand/90 h-8 text-xs px-4 text-brand-foreground">
                <Link href="/login" className="flex items-center gap-2">
                  Đăng nhập ngay
                  <ChevronRight size={14} />
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
      <section className="mb-0 xl:mb-12">
        <Card className="bg-transparent border border-border/50 shadow-none relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80" />
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <span className="w-1 h-3.5 bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end rounded-full shrink-0" />
              Sách hay cho bạn
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex flex-col gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3 p-2">
                  <div className="w-16 h-24 bg-black/10 dark:bg-white/10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 mt-2">
                    <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-0 xl:mb-12">
        <Card className="bg-transparent border border-border/50 shadow-none relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80" />
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <span className="w-1 h-3.5 bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end rounded-full shrink-0" />
              Sách hay cho bạn
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400 font-medium text-sm">
                Không thể tải đề xuất
              </p>
              <p className="text-red-500 dark:text-red-300 text-xs mt-1">
                Đã có lỗi xảy ra. Vui lòng thử lại sau.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }


  // Hiển thị đúng số lượng từ API (limit)
  const displayedBooks = data?.recommendations || [];

  return (
    <section className="mb-0 xl:mb-12">
      <Card className="bg-transparent border border-border/50 shadow-none relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80" />
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 pt-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <span className="w-1 h-3.5 bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end rounded-full shrink-0" />
            Sách hay cho bạn
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          {displayedBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 bg-brand/10 rounded-full flex items-center justify-center mb-4">
                <BookOpen size={24} className="text-brand" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm">
                Chưa có gợi ý
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Hãy theo dõi, đọc hoặc đánh giá thêm các sách để nhận được những gợi ý tác phẩm phù hợp nhất với bạn nhé!
              </p>
            </div>
          ) : (
            <div className="flex xl:flex-col gap-3 overflow-x-auto xl:overflow-x-visible pb-2 xl:pb-0 scrollbar-hide">
              {displayedBooks.map((rec, index) => (
                <div
                  key={rec.bookId}
                  className="relative w-[260px] flex-none xl:w-auto h-full"
                  onMouseEnter={() => setHoveredId(rec.bookId)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <Button
                    variant="ghost"
                    onClick={() => router.push(`/books/${rec.book.slug}`)}
                    className="flex gap-3 w-full h-full text-left hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg p-2 transition-all duration-200 group justify-start items-start"
                  >
                    {/* Book Cover */}
                    <div className="relative w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                      <SafeImage
                        src={rec.book.coverUrl}
                        alt={rec.book.title}
                        fill
                        sizes="64px"
                        priority={index < 4}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {rec.matchScore && (
                        <div className="absolute top-1 right-1 bg-brand text-brand-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {rec.matchScore}%
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 min-w-0 flex flex-col pt-1">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-brand transition-colors mb-1 break-words whitespace-normal text-left">
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
          )}
        </CardContent>
      </Card>
    </section>
  );
};
