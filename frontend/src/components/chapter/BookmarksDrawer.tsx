'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetBookmarksByBookQuery, useDeleteBookmarkMutation, Bookmark } from '@/features/bookmarks/api/bookmarkApi';
import { Bookmark as BookmarkIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter, useParams } from 'next/navigation';

interface BookmarksDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  bookSlug?: string;
  currentChapterSlug?: string;
}

const BookmarkItem = ({ bookmark, onSelect }: { bookmark: Bookmark; onSelect: (bookmark: Bookmark) => void }) => {
  const [deleteBookmark] = useDeleteBookmarkMutation();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBookmark({ paragraphId: bookmark.paragraphId, bookId: bookmark.bookId });
  };

  return (
    <div 
      className="flex flex-col gap-2 p-4 rounded-xl border border-border/50 bg-muted/30 relative group cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onSelect(bookmark)}
    >
      <button 
        onClick={handleDelete}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
        title="Xóa bookmark"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3 pr-8 italic">
        &ldquo;{bookmark.textPreview}&rdquo;
      </p>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
        <span className="opacity-70">
          Chương: {bookmark.chapterSlug}
        </span>
        <span className="opacity-70">
          {format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: vi })} {/* Assuming bookmark has createdAt, currently using now */}
        </span>
      </div>
    </div>
  );
};

export const BookmarksDrawer = ({ open, onOpenChange, bookId, bookSlug: propBookSlug, currentChapterSlug: propCurrentChapterSlug }: BookmarksDrawerProps) => {
  const router = useRouter();
  const params = useParams();
  const currentChapterSlug = propCurrentChapterSlug || (params.chapterSlug as string);
  const bookSlug = propBookSlug || (params.bookSlug as string);

  const { data, isLoading } = useGetBookmarksByBookQuery(bookId, {
    skip: !open || !bookId
  });

  const bookmarks = data || [];

  const handleSelectBookmark = (bookmark: Bookmark) => {
    onOpenChange(false);

    if (bookmark.chapterSlug !== currentChapterSlug) {
      router.push(`/books/${bookSlug}/chapters/${bookmark.chapterSlug}#paragraph-${bookmark.paragraphId}`);
      return;
    }
    
    setTimeout(() => {
      const element = document.getElementById(`paragraph-${bookmark.paragraphId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-primary/20', 'transition-colors', 'duration-500');
        setTimeout(() => {
          element.classList.remove('bg-primary/20');
        }, 2000);
      }
    }, 300);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0 flex flex-col border-l-border">
        <SheetHeader className="p-6 pb-4 border-b border-border/50 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <BookmarkIcon className="w-5 h-5 text-primary fill-current" />
            Bookmarks
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={`bookmark-skeleton-${i}`} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground pt-10">
              <BookmarkIcon className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">Chưa có bookmark nào</p>
              <p className="text-sm mt-1">Bấm vào biểu tượng bookmark bên cạnh mỗi đoạn văn để lưu lại vị trí đọc.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarks.map(bookmark => (
                <BookmarkItem 
                  key={bookmark.id} 
                  bookmark={bookmark} 
                  onSelect={handleSelectBookmark}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
