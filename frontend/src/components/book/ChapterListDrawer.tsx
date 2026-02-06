import { cn } from '@/lib/utils';
import { Button } from '@/src/components/ui/button';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/src/components/ui/sheet';
import { Chapter } from '@/src/features/chapters/types/chapter.interface';
import { useRouter } from 'next/navigation';

interface ChapterListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  bookSlug: string;
  currentChapterSlug?: string;
  totalChapters?: number;
  hasHeader?: boolean;
}

export default function ChapterListDrawer({
  isOpen,
  onClose,
  chapters,
  bookSlug,
  currentChapterSlug,
  totalChapters,
  hasHeader = false,
}: ChapterListDrawerProps) {
  const router = useRouter();

  const handleChapterSelect = (slug: string) => {
    onClose();
    router.push(`/books/${bookSlug}/chapters/${slug}`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col gap-0 border-l border-border bg-background">
        <SheetHeader className="p-5 border-b border-border bg-background">
          <SheetTitle className="text-lg font-bold">Mục lục</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground mt-0.5">
            {totalChapters || chapters.length} chương
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {chapters.map((chap) => {
              const isActive = chap.slug === currentChapterSlug;
              return (
                <Button
                  key={chap.id}
                  variant={isActive ? "secondary" : "ghost"}
                  onClick={() => handleChapterSelect(chap.slug)}
                  className={cn(
                    "w-full justify-between h-auto py-3 px-4 rounded-xl transition-all",
                    isActive
                      ? "bg-blue-50 text-blue-900 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex flex-col gap-0.5 items-start text-left w-full overflow-hidden">
                    <span
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      Chương {chap.orderIndex}
                    </span>
                    <span className="text-sm font-medium line-clamp-1 w-full">
                      {chap.title}
                    </span>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] shrink-0 ml-2" />
                  )}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
