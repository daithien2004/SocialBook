import Link from 'next/link';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';

interface ChapterNavigationProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  showTableOfContents?: boolean;
  tableOfContentsHref?: string;
  onTableOfContentsClick?: () => void;
}

export default function ChapterNavigation({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  showTableOfContents = false,
  tableOfContentsHref,
  onTableOfContentsClick,
}: ChapterNavigationProps) {
  const buttonClass = (disabled: boolean) => `
    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
    ${
      disabled
        ? 'border-transparent text-neutral-700 cursor-not-allowed'
        : 'border-white/10 text-neutral-400 hover:text-white hover:border-white/30 hover:bg-white/5 active:scale-95'
    }
  `;

  const primaryButtonClass = (disabled: boolean) => `
    flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-lg
    ${
      disabled
        ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 active:scale-95'
    }
  `;

  return (
    <nav className="flex justify-between items-center w-full">
      {/* Nút Previous */}
      <button
        onClick={onPrevious}
        disabled={!hasPrevious}
        className={buttonClass(!hasPrevious)}
        aria-label="Chương trước"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Chương trước</span>
      </button>

      {showTableOfContents &&
        (onTableOfContentsClick ? (
          <button
            onClick={onTableOfContentsClick}
            className="text-neutral-500 hover:text-white transition-colors p-2"
          >
            <List size={20} />
          </button>
        ) : (
          <Link
            href={tableOfContentsHref || '#'}
            className="text-neutral-500 hover:text-white transition-colors p-2"
          >
            <List size={20} />
          </Link>
        ))}

      <button
        onClick={onNext}
        disabled={!hasNext}
        className={primaryButtonClass(!hasNext)}
        aria-label="Chương sau"
      >
        <span className="hidden sm:inline">Chương sau</span>
        <span className="sm:hidden">Tiếp</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
