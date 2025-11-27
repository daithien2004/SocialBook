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
    <header className={`py-8 text-center space-y-4 ${className}`}>
      {showBookLink && (
        <Link
          href={`/books/${bookSlug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
        >
          <BookOpen size={14} />
          <span>{bookTitle}</span>
        </Link>
      )}

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-100 leading-tight">
        <span className="block text-lg sm:text-xl text-neutral-500 font-normal mb-1">
          Chương {chapterOrder}
        </span>
        {chapterTitle}
      </h1>

      <div className="flex items-center justify-center gap-6 text-sm text-neutral-500">
        <div className="flex items-center gap-1.5">
          <Eye size={16} />
          <span>{viewsCount.toLocaleString('vi-VN')} lượt xem</span>
        </div>
      </div>

      <div className="w-24 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mx-auto mt-6 rounded-full" />
    </header>
  );
}
