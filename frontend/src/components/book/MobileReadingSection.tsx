'use client';

import { ChevronRight, LogIn } from 'lucide-react';
import Link from 'next/link';
import { SafeImage } from '@/components/common/SafeImage';
import { LibraryItem } from '@/features/library/types/library.interface';

interface MobileReadingSectionProps {
  books: LibraryItem[];
  isLoading: boolean;
  isGuest: boolean;
}

const EMPTY_BOOKS: LibraryItem[] = [];

export function MobileReadingSection({ books = EMPTY_BOOKS, isLoading, isGuest }: MobileReadingSectionProps) {

  // Chưa đăng nhập
  if (isGuest) {
    return (
      <section className="xl:hidden px-4 py-6">
        <div className="bg-transparent p-0 border-b border-gray-200/50 dark:border-white/10">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
            Sách đang đọc
          </h2>

          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
              <LogIn size={28} className="text-brand" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Đăng nhập để tiếp tục đọc
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Theo dõi tiến trình đọc sách và tiếp tục từ nơi bạn dừng lại
            </p>
            <Link
              href="/login"
              className="px-6 py-2.5 bg-brand hover:bg-brand/90 text-brand-foreground rounded-full font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
            >
              Đăng nhập ngay
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Đang loading
  if (isLoading) {
    return (
      <section className="xl:hidden px-4 py-6">
        <div className="bg-transparent p-0 border-b border-gray-200/50 dark:border-white/10">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
            Sách đang đọc
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-none w-32 animate-pulse">
                <div className="aspect-[2/3] bg-gray-200 dark:bg-white/5 rounded-lg mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-full mb-2" />
                <div className="h-8 bg-gray-200 dark:bg-white/5 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Không có sách đang đọc
  if (books.length === 0) {
    return (
      <section className="xl:hidden px-4 py-6">
        <div className="bg-transparent p-0 border-b border-gray-200/50 dark:border-white/10">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
            Sách đang đọc
          </h2>

          <div className="flex flex-col items-center justify-center py-8 text-center">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Chưa có sách nào
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Khám phá và bắt đầu đọc sách yêu thích của bạn
            </p>
            <Link
              href="/books"
              className="px-6 py-2.5 bg-brand hover:bg-brand/90 text-brand-foreground rounded-full font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
            >
              Khám phá ngay
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const displayBooks = books.slice(0, 10);
  const hasMore = books.length > 10;

  return (
    <section className="xl:hidden px-4 py-6">
      <div className="bg-transparent p-0 border-b border-gray-200/50 dark:border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">
            Sách đang đọc
          </h2>
          {hasMore && (
            <Link
              href="/library"
              className="text-xs text-brand hover:underline font-medium"
            >
              Xem tất cả
            </Link>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {displayBooks.filter(item => item.bookId).map((item, index) => (
            <div key={item.bookId.slug} className="flex-none w-32 flex flex-col">
              {/* Book Cover */}
              <Link
                href={`/books/${item.bookId.slug}`}
                className="block relative aspect-[2/3] rounded-lg overflow-hidden shadow-sm mb-2 hover:shadow-md transition-shadow"
              >
                <SafeImage
                  src={item.bookId.coverUrl}
                  alt={item.bookId.title}
                  fill
                  sizes="128px"
                  priority={index < 4}
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </Link>

              {/* Book Info */}
              <Link
                href={`/books/${item.bookId.slug}`}
                className="block font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 hover:text-primary transition-colors mb-2 min-h-[2.5rem]"
              >
                {item.bookId.title}
              </Link>

              {/* Action Button */}
              {item.lastReadChapterId ? (
                <Link
                  href={`/books/${item.bookId.slug}/chapters/${item.lastReadChapterId.slug}`}
                  className="w-full mt-auto flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-none text-xs font-semibold py-2 rounded-lg transition-all active:scale-[0.98]"
                >
                  Chương {item.lastReadChapterId.orderIndex}
                </Link>
              ) : (
                <Link
                  href={`/books/${item.bookId.slug}`}
                  className="w-full mt-auto flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 text-xs font-semibold py-2 rounded-lg transition-all"
                >
                  Bắt đầu đọc
                </Link>
              )}
            </div>
          ))}
        </div>

        {hasMore && (
          <Link
            href="/library"
            className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
          >
            Xem thêm {books.length - 10} sách
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </section>
  );
}
