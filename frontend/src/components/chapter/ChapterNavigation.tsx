import { cn } from '@/lib/utils';
import { Button } from '@/src/components/ui/button';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import Link from 'next/link';

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
  return (
    <nav className="flex justify-between items-center w-full">
      {/* Nút Previous */}
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!hasPrevious}
        className={cn(
          "rounded-full gap-2 border-white/10 text-neutral-400 hover:text-white hover:border-white/30 hover:bg-white/5",
          !hasPrevious && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Chương trước"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Chương trước</span>
      </Button>

      {showTableOfContents &&
        (onTableOfContentsClick ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onTableOfContentsClick}
            className="text-neutral-500 hover:text-white hover:bg-white/5 rounded-full"
          >
            <List size={20} />
          </Button>
        ) : (
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-neutral-500 hover:text-white hover:bg-white/5 rounded-full"
          >
            <Link href={tableOfContentsHref || '#'}>
              <List size={20} />
            </Link>
          </Button>
        ))}

      <Button
        onClick={onNext}
        disabled={!hasNext}
        className={cn(
          "rounded-full gap-2 shadow-lg shadow-blue-900/20 bg-blue-600 hover:bg-blue-500 text-white",
          !hasNext && "bg-neutral-800 text-neutral-600 shadow-none hover:bg-neutral-800 cursor-not-allowed"
        )}
        aria-label="Chương sau"
      >
        <span className="hidden sm:inline">Chương sau</span>
        <span className="sm:hidden">Tiếp</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </nav>
  );
}
