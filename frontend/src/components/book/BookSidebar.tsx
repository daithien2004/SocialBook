'use client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book } from '@/features/books/types/book.interface';
import { Chapter } from '@/features/chapters/types/chapter.interface';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ChapterListDrawer from './ChapterListDrawer';

interface BookSidebarProps {
  book: Book;
  bookSlug: string;
}

export const BookSidebar = ({ book, bookSlug }: BookSidebarProps) => {
  const router = useRouter();
  const [showAllChapters, setShowAllChapters] = useState(false);

  const recentChapters = book.chapters
    ? [...book.chapters].reverse().slice(0, 5)
    : [];

  const allChapters = book.chapters ? [...book.chapters].reverse() : [];

  return (
    <>
      <div className="space-y-8">
        {/* Thông tin chi tiết */}
        <Card className="border-border shadow-sm dark:shadow-lg bg-card text-card-foreground">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Thông tin chi tiết
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm">
            <DetailRow
              label="Tình trạng"
              value={
                book.status === 'completed' ? 'Hoàn thành' : 'Đang cập nhật'
              }
              highlight
            />
            <DetailRow label="Số chương" value={book.chapters?.length || 0} />
            <DetailRow label="Năm xuất bản" value={book.publishedYear} />
            <DetailRow
              label="Cập nhật cuối"
              value={new Date(book.updatedAt).toLocaleDateString('vi-VN')}
            />
          </CardContent>
        </Card>

        {/* Chương mới */}
        <Card className="border-border shadow-sm dark:shadow-lg bg-card text-card-foreground">
          <CardHeader className="pb-2 border-b border-border flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Chương mới
            </CardTitle>
            <Button
              variant="link"
              className="text-xs h-auto p-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
              onClick={() => setShowAllChapters(true)}
            >
              Xem tất cả
            </Button>
          </CardHeader>

          <CardContent className="pt-2 px-2">
            <div className="space-y-1">
              {recentChapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/books/${bookSlug}/chapters/${chapter.slug}`}
                  className="block p-3 rounded-md hover:bg-muted transition-all group"
                >
                  <h4 className="font-medium text-sm mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 line-clamp-1 transition-colors">
                    {chapter.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Chương {chapter.orderIndex}</span>
                    <span>
                      {new Date(chapter.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DRAWER MỤC LỤC */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300",
          showAllChapters ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
        onClick={() => setShowAllChapters(false)}
      />

      <ChapterListDrawer
        isOpen={showAllChapters}
        onClose={() => setShowAllChapters(false)}
        chapters={allChapters as unknown as Chapter[]}
        bookSlug={bookSlug}
        totalChapters={allChapters.length}
        hasHeader={true}
      />
    </>
  );
};

interface DetailRowProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

const DetailRow = ({ label, value, highlight }: DetailRowProps) => (
  <div className="flex justify-between items-center py-2 border-b border-border last:border-0 hover:bg-muted/50 px-2 rounded-sm transition-colors">
    <span className="text-muted-foreground">{label}</span>
    <span
      className={cn(
        "font-semibold",
        highlight && value === 'Hoàn thành'
          ? 'text-green-600 dark:text-green-500'
          : highlight
            ? 'text-yellow-600 dark:text-yellow-500'
            : 'text-foreground'
      )}
    >
      {value}
    </span>
  </div>
);
