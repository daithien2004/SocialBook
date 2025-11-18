// components/ChapterNavigation.tsx
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChapterNavigationProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  showTableOfContents?: boolean;
  tableOfContentsHref?: string;
  tableOfContentsText?: string;
  variant?: 'top' | 'bottom';
}

export default function ChapterNavigation({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  showTableOfContents = false,
  tableOfContentsHref = '#',
  tableOfContentsText = 'Mục lục',
  variant = 'top',
}: ChapterNavigationProps) {
  const buttonBaseClass =
    'flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition';
  const buttonActiveClass = 'bg-blue-600 text-white hover:bg-blue-700';
  const buttonDisabledClass = 'bg-gray-700 text-gray-400 cursor-not-allowed';

  const previousButtonText = variant === 'top' ? 'Chương trước' : 'Trước';
  const nextButtonText = variant === 'top' ? 'Chương sau' : 'Sau';

  return (
    <nav className="p-4 flex justify-between items-center max-w-3xl mx-auto w-full">
      {/* Nút Chương trước */}
      <button
        onClick={onPrevious}
        disabled={!hasPrevious}
        className={`${buttonBaseClass} ${
          !hasPrevious ? buttonDisabledClass : buttonActiveClass
        }`}
        aria-label="Chương trước"
      >
        <ChevronLeft className="w-5 h-5" />
        {previousButtonText}
      </button>

      {/* Hiển thị nút Mục lục hoặc khoảng trống */}
      {showTableOfContents ? (
        <Link
          href={tableOfContentsHref}
          className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm font-medium"
        >
          {tableOfContentsText}
        </Link>
      ) : (
        <div className="w-20" /> // Spacer để giữ layout cân đối
      )}

      {/* Nút Chương sau */}
      <button
        onClick={onNext}
        disabled={!hasNext}
        className={`${buttonBaseClass} ${
          !hasNext ? buttonDisabledClass : buttonActiveClass
        }`}
        aria-label="Chương sau"
      >
        {nextButtonText}
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
}
