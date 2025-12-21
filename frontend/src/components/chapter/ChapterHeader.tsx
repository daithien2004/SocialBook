import Link from 'next/link';
import { Eye, BookOpen, Clock } from 'lucide-react';

interface ChapterHeaderProps {
  bookTitle: string;
  bookSlug: string;
  chapterTitle: string;
  chapterOrder: number;
  viewsCount: number;
  showBookLink?: boolean;
  className?: string;
}

export default function ChapterHeader({
  bookTitle,
  bookSlug,
  chapterTitle,
  chapterOrder,
  viewsCount,
  showBookLink = true,
  className = '',
}: ChapterHeaderProps) {
  return (
    <header className={`py-8 text-center space-y-6 max-w-2xl mx-auto ${className}`}>
      {showBookLink && (
        <Link
          href={`/books/${bookSlug}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest"
        >
          <BookOpen size={14} />
          <span>{bookTitle}</span>
        </Link>
      )}

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
        <span className="block text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">
          Chương {chapterOrder}
        </span>
        {chapterTitle}
      </h1>

      <div className="flex items-center justify-center gap-6 text-sm text-gray-400 dark:text-gray-500 font-medium">
        <div className="flex items-center gap-2">
          <Eye size={16} />
          <span>{viewsCount.toLocaleString('vi-VN')} lượt đọc</span>
        </div>
      </div>
      
      {/* Minimal Divider */}
      <div className="w-16 h-px bg-gray-200 dark:bg-white/10 mx-auto" />
    </header>
  );
}
