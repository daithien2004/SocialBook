// components/ChapterHeader.tsx
import Link from 'next/link';
import { Eye } from 'lucide-react';

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
    <header className={`p-4 bg-white text-gray-900 shadow-md ${className}`}>
      <div className="max-w-3xl">
        {/* Breadcrumb - Link về truyện */}
        {showBookLink && (
          <Link
            href={`/books/${bookSlug}`}
            className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 transition-colors"
          >
            <span>←</span>
            <span>{bookTitle}</span>
          </Link>
        )}

        {/* Tiêu đề chương */}
        <h1 className="text-xl font-bold mt-1 text-gray-900">{chapterTitle}</h1>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
          {/* Số thứ tự chương */}
          <span className="font-medium">Chương {chapterOrder}</span>

          <span className="text-gray-400">•</span>

          {/* Lượt xem */}
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{viewsCount.toLocaleString('vi-VN')} lượt xem</span>
          </div>
        </div>
      </div>
    </header>
  );
}
