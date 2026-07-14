'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LibraryItem } from '@/features/library/types/library.interface';
import { ChevronRight, LogIn } from 'lucide-react';
import Link from 'next/link';
import { SafeImage } from '@/components/common/SafeImage';

interface ReadingSidebarProps {
  books: LibraryItem[];
  isLoading: boolean;
  isGuest: boolean;
}

const EMPTY_BOOKS: LibraryItem[] = [];

export function ReadingSidebar({ books = EMPTY_BOOKS, isLoading, isGuest }: ReadingSidebarProps) {

  // Chưa đăng nhập
  if (isGuest) {
    return (
      <aside className="hidden xl:block xl:w-64 flex-shrink-0">
        <div className="sticky top-8">
          <Card className="bg-transparent border border-border/50 shadow-none overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80" />
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 pt-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span className="w-1 h-3.5 bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end rounded-full shrink-0" />
                Sách đang đọc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
                  <LogIn size={28} className="text-brand" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm">
                  Đăng nhập để tiếp tục đọc
                </h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                  Theo dõi tiến trình đọc sách và tiếp tục từ nơi bạn dừng lại
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
        </div>
      </aside>
    );
  }

  // Đang loading
  if (isLoading) {
    return (
      <aside className="hidden xl:block xl:w-64 flex-shrink-0">
        <div className="sticky top-8">
          <Card className="bg-transparent border border-border/50 shadow-none overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80" />
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 pt-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span className="w-1 h-3.5 bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end rounded-full shrink-0" />
                Sách đang đọc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
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

  const booksArray = books;

  // Không có sách đang đọc
  if (booksArray.length === 0) {
    return (
      <aside className="hidden xl:block xl:w-64 flex-shrink-0">
        <div className="sticky top-8">
          <Card className="bg-transparent border border-border/50 shadow-none overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80" />
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 pt-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span className="w-1 h-3.5 bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end rounded-full shrink-0" />
                Sách đang đọc
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <h3 className="font-semibold text-foreground mb-2 text-sm">
                  Chưa có sách nào
                </h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                  Khám phá và bắt đầu đọc sách yêu thích của bạn
                </p>
                <Button asChild className="rounded-full shadow-sm hover:shadow-md bg-brand hover:bg-brand/90 h-8 text-xs px-4 text-brand-foreground">
                  <Link href="/books" className="flex items-center gap-2">
                    Khám phá ngay
                    <ChevronRight size={14} />
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
        <Card className="bg-transparent border border-border/50 shadow-none overflow-hidden relative">
          {/* Top accent gradient line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-gradient-start to-brand-gradient-end opacity-80" />
          
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 pt-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <span className="w-1 h-3.5 bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end rounded-full shrink-0" />
              Sách đang đọc
            </CardTitle>
            {hasMore && (
              <Button variant="link" size="sm" asChild className="text-brand p-0 h-auto text-xs">
                <Link href="/library">Xem tất cả</Link>
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {displayBooks.filter(item => item.bookId).map((item, index) => (
              <div key={item.id || item.bookId?.slug || `book-${index}`} className="flex gap-3 group">
                <Link
                  href={`/books/${item.bookId.slug}`}
                  className="relative w-16 h-24 rounded-lg overflow-hidden shadow-sm flex-shrink-0 hover:shadow-md transition-shadow"
                >
                  <SafeImage
                    src={item.bookId.coverUrl}
                    alt={item.bookId.title}
                    fill
                    sizes="64px"
                    priority={index < 4}
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                <div className="flex-1 min-w-0 flex flex-col">
                  <Link
                    href={`/books/${item.bookId.slug}`}
                    className="font-semibold text-sm text-foreground line-clamp-2 hover:text-primary transition-colors mb-1"
                  >
                    {item.bookId.title}
                  </Link>

                  {item.lastReadChapterId ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-2">
                        Chương {item.lastReadChapterId.orderIndex}
                      </p>
                      <Button asChild size="sm" className="mt-auto w-full h-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-none transition-all active:scale-[0.98] gap-1.5">
                        <Link href={`/books/${item.bookId.slug}/chapters/${item.lastReadChapterId.slug}`}>
                          Đọc tiếp
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button asChild size="sm" className="mt-auto w-full h-8 bg-secondary/50 hover:bg-secondary text-secondary-foreground border border-border shadow-none transition-all active:scale-[0.98] gap-1.5">
                      <Link href={`/books/${item.bookId.slug}`}>Bắt đầu đọc</Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {hasMore && (
              <Button asChild variant="ghost" className="w-full mt-2 text-muted-foreground hover:text-brand">
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
