import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

const ChapterNavigation = memo(function ChapterNavigation({
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
          "rounded-full gap-2 border border-border/80 bg-background text-foreground hover:bg-accent hover:border-border",
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
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
          >
            <List size={20} />
          </Button>
        ) : (
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
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
          "rounded-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground",
          !hasNext && "bg-muted text-muted-foreground shadow-none hover:bg-muted cursor-not-allowed"
        )}
        aria-label="Chương sau"
      >
        <span className="hidden sm:inline">Chương sau</span>
        <span className="sm:hidden">Tiếp</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </nav>
  );
});

export default ChapterNavigation;
