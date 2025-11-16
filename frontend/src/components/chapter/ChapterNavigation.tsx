// components/ChapterNavigation.tsx
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChapterNavigationProps {
  currentIndex: number;
  totalChapters: number;
  onPrevious: () => void;
  onNext: () => void;
  showTableOfContents?: boolean;
  tableOfContentsHref?: string;
  tableOfContentsText?: string;
  variant?: 'top' | 'bottom';
}

export default function ChapterNavigation({
  currentIndex,
  totalChapters,
  onPrevious,
  onNext,
  showTableOfContents = false,
  tableOfContentsHref = '#',
  tableOfContentsText = 'Mục lục',
  variant = 'top',
}: ChapterNavigationProps) {
  const isPreviousDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex >= totalChapters - 1;

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
        disabled={isPreviousDisabled}
        className={`${buttonBaseClass} ${
          isPreviousDisabled ? buttonDisabledClass : buttonActiveClass
        }`}
        aria-label="Chương trước"
      >
        <ChevronLeft className="w-5 h-5" />
        {previousButtonText}
      </button>

      {/* Hiển thị vị trí hoặc nút Mục lục */}
      {showTableOfContents ? (
        <Link
          href={tableOfContentsHref}
          className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm font-medium"
        >
          {tableOfContentsText}
        </Link>
      ) : (
        <span className="text-sm font-semibold">
          {currentIndex + 1} / {totalChapters}
        </span>
      )}

      {/* Nút Chương sau */}
      <button
        onClick={onNext}
        disabled={isNextDisabled}
        className={`${buttonBaseClass} ${
          isNextDisabled ? buttonDisabledClass : buttonActiveClass
        }`}
        aria-label="Chương sau"
      >
        {nextButtonText}
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
}
