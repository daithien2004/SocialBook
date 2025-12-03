'use client';

import { BookOpen, ChevronRight, LogIn } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useGetLibraryBooksQuery } from '@/src/features/library/api/libraryApi';
import { LibraryStatus } from '@/src/features/library/types/library.interface';
import { useSession } from 'next-auth/react';

export function ReadingSidebar() {
  const { data: session, status } = useSession();
  const { data: books = [], isLoading } = useGetLibraryBooksQuery(
    { status: LibraryStatus.READING },
    { skip: status !== 'authenticated' }
  );

  // Chưa đăng nhập
  if (status === 'unauthenticated') {
    return (
      <aside className="hidden xl:block xl:w-80 flex-shrink-0">
        <div className="sticky top-8">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-white/10 p-6 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen
                className="text-blue-600 dark:text-blue-400"
                size={20}
              />
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                Sách đang đọc
              </h2>
            </div>

            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <LogIn size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Đăng nhập để tiếp tục đọc
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
                Theo dõi tiến trình đọc sách và tiếp tục từ nơi bạn dừng lại
              </p>
              <Link
                href="/login"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
              >
                Đăng nhập ngay
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Đang loading
  if (isLoading) {
    return (
      <aside className="hidden xl:block xl:w-80 flex-shrink-0">
        <div className="sticky top-8">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-white/10 p-6 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen
                className="text-blue-600 dark:text-blue-400"
                size={20}
              />
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                Sách đang đọc
              </h2>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-16 h-24 bg-gray-200 dark:bg-white/5 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-3/4" />
                    <div className="h-8 bg-gray-200 dark:bg-white/5 rounded w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Không có sách đang đọc
  if (books.length === 0) {
    return (
      <aside className="hidden xl:block xl:w-80 flex-shrink-0">
        <div className="sticky top-8">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-white/10 p-6 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen
                className="text-blue-600 dark:text-blue-400"
                size={20}
              />
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                Sách đang đọc
              </h2>
            </div>

            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                <BookOpen
                  size={28}
                  className="text-gray-400 dark:text-gray-500"
                />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Chưa có sách nào
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
                Khám phá và bắt đầu đọc sách yêu thích của bạn
              </p>
              <Link
                href="/books"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
              >
                Khám phá ngay
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const displayBooks = books.slice(0, 5);
  const hasMore = books.length > 5;

  return (
    <aside className="hidden xl:block xl:w-80 flex-shrink-0">
      <div className="sticky top-8">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-white/10 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen
                className="text-blue-600 dark:text-blue-400"
                size={20}
              />
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                Sách đang đọc
              </h2>
            </div>
            {hasMore && (
              <Link
                href="/library"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Xem tất cả
              </Link>
            )}
          </div>

          <div className="space-y-4">
            {displayBooks.map((item) => (
              <div key={item.id} className="flex gap-3 group">
                {/* Book Cover */}
                <Link
                  href={`/books/${item.bookId.slug}`}
                  className="relative w-16 h-24 rounded-lg overflow-hidden shadow-sm flex-shrink-0 hover:shadow-md transition-shadow"
                >
                  <Image
                    src={item.bookId.coverUrl}
                    alt={item.bookId.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Book Info */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <Link
                    href={`/books/${item.bookId.slug}`}
                    className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-1"
                  >
                    {item.bookId.title}
                  </Link>

                  {item.lastReadChapterId ? (
                    <>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Chương {item.lastReadChapterId.orderIndex}
                      </p>
                      <Link
                        href={`/books/${item.bookId.slug}/chapters/${item.lastReadChapterId.slug}`}
                        className="mt-auto w-full flex items-center justify-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 text-xs font-semibold py-1.5 rounded-lg transition-all"
                      >
                        <BookOpen size={12} />
                        Đọc tiếp
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={`/books/${item.bookId.slug}`}
                      className="mt-auto w-full flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 text-xs font-semibold py-1.5 rounded-lg transition-all"
                    >
                      Bắt đầu đọc
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <Link
              href="/library"
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
            >
              Xem thêm {books.length - 5} sách
              <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
