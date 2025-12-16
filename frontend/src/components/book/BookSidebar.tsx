import { Book } from '@/src/features/books/types/book.interface';
import Link from 'next/link';
import { useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

  const handleChapterSelect = (chapterSlug: string) => {
    setShowAllChapters(false);
    router.push(`/books/${bookSlug}/chapters/${chapterSlug}`);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Thông tin chi tiết */}
        <div className="bg-white dark:bg-black/70 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm dark:shadow-lg">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider text-sm border-b border-gray-100 dark:border-white/5 pb-2">
            Thông tin chi tiết
          </h3>
          <div className="space-y-4 text-sm">
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
          </div>
        </div>

        {/* Chương mới */}
        <div className="bg-white dark:bg-black/70 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100 dark:border-white/5">
            <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">
              Chương mới
            </h3>
            <button
              onClick={() => setShowAllChapters(true)}
              className="text-xs text-red-600 hover:underline transition-colors"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-2">
            {recentChapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/books/${bookSlug}/chapters/${chapter.slug}`}
                className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/5 transition-all group"
              >
                <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-1 group-hover:text-red-600 line-clamp-1">
                  {chapter.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Chương {chapter.orderIndex}</span>
                  <span>
                    {new Date(chapter.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* DRAWER MỤC LỤC (giống ChapterPage) */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          showAllChapters ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setShowAllChapters(false)}
      />

      {/* Drawer Panel */}
      <ChapterListDrawer
        isOpen={showAllChapters}
        onClose={() => setShowAllChapters(false)}
        chapters={allChapters}
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
  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
    <span className="text-gray-500">{label}</span>
    <span
      className={`font-semibold ${
        highlight && value === 'Hoàn thành'
          ? 'text-green-600'
          : highlight
          ? 'text-yellow-600'
          : 'text-gray-900 dark:text-white'
      }`}
    >
      {value}
    </span>
  </div>
);
