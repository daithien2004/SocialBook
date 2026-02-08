'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetLibraryBooksQuery } from '@/features/library/api/libraryApi';
import { LibraryStatus } from '@/features/library/types/library.interface';
import { useAppAuth } from '@/hooks/useAppAuth';
import { BookOpen, ChevronRight, LogIn } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function ReadingSidebar() {
  const { isAuthenticated, isGuest } = useAppAuth();
  const { data: books = [], isLoading } = useGetLibraryBooksQuery(
    { status: LibraryStatus.READING },
    { skip: !isAuthenticated }
  );

  // Chưa đăng nhập
  if (isGuest) {
    return (
      <aside className="hidden xl:block xl:w-64 flex-shrink-0">
        <div className="sticky top-8">
          <Card className="border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none transition-colors duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="text-blue-600 dark:text-blue-400" size={20} />
                Sách đang đọc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                  <LogIn size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Đăng nhập để tiếp tục đọc
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                  Theo dõi tiến trình đọc sách và tiếp tục từ nơi bạn dừng lại
                </p>
                <Button asChild className="rounded-full shadow-sm hover:shadow-md bg-blue-600 hover:bg-blue-700">
                  <Link href="/login" className="flex items-center gap-2">
                    Đăng nhập ngay
                    <ChevronRight size={16} />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </aside>
    );
  }

  // Đang loading
  if (isLoading) {
    return (
      <aside className="hidden xl:block xl:w-64 flex-shrink-0">
        <div className="sticky top-8">
          <Card className="border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none transition-colors duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="text-blue-600 dark:text-blue-400" size={20} />
                Sách đang đọc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-16 h-24 bg-gray-200 dark:bg-accent/10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-accent/10 rounded w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-accent/10 rounded w-3/4" />
                    <div className="h-8 bg-gray-200 dark:bg-accent/10 rounded w-full mt-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </aside>
    );
  }

  const booksArray = Array.isArray(books) ? books : [];

  // Không có sách đang đọc
  if (booksArray.length === 0) {
    return (
      <aside className="hidden xl:block xl:w-64 flex-shrink-0">
        <div className="sticky top-8">
          <Card className="border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none transition-colors duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="text-blue-600 dark:text-blue-400" size={20} />
                Sách đang đọc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <BookOpen size={28} className="text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Chưa có sách nào
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                  Khám phá và bắt đầu đọc sách yêu thích của bạn
                </p>
                <Button asChild className="rounded-full shadow-sm hover:shadow-md bg-blue-600 hover:bg-blue-700">
                  <Link href="/books" className="flex items-center gap-2">
                    Khám phá ngay
                    <ChevronRight size={16} />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </aside>
    );
  }

  const displayBooks = booksArray.slice(0, 5);
  const hasMore = booksArray.length > 5;

  return (
    <aside className="hidden xl:block xl:w-64 flex-shrink-0">
      <div className="sticky top-8">
        <Card className="border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none transition-colors duration-300">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="text-blue-600 dark:text-blue-400" size={20} />
              Sách đang đọc
            </CardTitle>
            {hasMore && (
              <Button variant="link" size="sm" asChild className="text-blue-600 dark:text-blue-400 p-0 h-auto">
                <Link href="/library">Xem tất cả</Link>
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {displayBooks.filter(item => item.bookId).map((item, index) => (
              <div key={item.id || (item as any)._id || item.bookId?.slug || `book-${index}`} className="flex gap-3 group">
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

                <div className="flex-1 min-w-0 flex flex-col">
                  <Link
                    href={`/books/${item.bookId.slug}`}
                    className="font-semibold text-sm text-foreground line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-1"
                  >
                    {item.bookId.title}
                  </Link>

                  {item.lastReadChapterId ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-2">
                        Chương {item.lastReadChapterId.orderIndex}
                      </p>
                      <Button asChild size="sm" variant="outline" className="mt-auto w-full h-8 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-500/20 gap-1.5">
                        <Link href={`/books/${item.bookId.slug}/chapters/${item.lastReadChapterId.slug}`}>
                          <BookOpen size={12} />
                          Đọc tiếp
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="mt-auto w-full h-8 bg-accent/5 hover:bg-accent/10 border-border gap-1.5">
                      <Link href={`/books/${item.bookId.slug}`}>Bắt đầu đọc</Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {hasMore && (
              <Button asChild variant="ghost" className="w-full mt-2 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400">
                <Link href="/library" className="flex items-center gap-2">
                  Xem thêm {books.length - 5} sách
                  <ChevronRight size={16} />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
