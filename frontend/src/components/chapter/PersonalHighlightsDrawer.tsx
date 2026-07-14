'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetHighlightsByBookQuery, useDeleteHighlightMutation, useUpdateHighlightMutation } from '@/features/user-highlights/api/userHighlightsApi';
import { UserHighlight } from '@/features/user-highlights/types/user-highlight.interface';
import { Trash2, Edit3, Check, Highlighter, MoveRight, LogIn } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAppAuth } from '@/features/auth/hooks';

interface PersonalHighlightsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  bookSlug?: string;
  currentChapterId?: string;
  chapters?: { id: string; slug: string }[];
}

const PRESET_COLORS = [
  '#fde047', // yellow-300
  '#86efac', // green-300
  '#93c5fd', // blue-300
  '#d8b4fe', // purple-300
  '#fca5a5', // red-300
];

const HighlightItem = ({ highlight, onSelect }: { highlight: UserHighlight; onSelect?: (h: UserHighlight) => void }) => {
  const [deleteHighlight] = useDeleteHighlightMutation();
  const [updateHighlight] = useUpdateHighlightMutation();
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(highlight.note || '');

  const handleSaveNote = async () => {
    await updateHighlight({ id: highlight.id, note: noteContent });
    setIsEditingNote(false);
  };

  const handleColorChange = (color: string) => {
    updateHighlight({ id: highlight.id, color });
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border/50 bg-muted/30 relative group">
      <p className="text-sm leading-relaxed border-l-4 pl-3" style={{ borderColor: highlight.color }}>
        {highlight.content}
      </p>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="opacity-70">
          {format(new Date(highlight.createdAt), 'dd MMMM yyyy, HH:mm', { locale: vi })}
        </span>
        <div className="flex items-center gap-1">
          {onSelect && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(highlight); }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all opacity-0 group-hover:opacity-100"
              title="Đi đến đoạn này"
            >
              <MoveRight className="w-3.5 h-3.5" />
            </button>
          )}
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              onClick={(e) => { e.stopPropagation(); handleColorChange(color); }}
              className="w-4 h-4 rounded-full border border-black/10 flex items-center justify-center transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
            >
              {highlight.color === color && <Check className="w-2.5 h-2.5 text-black/60" />}
            </button>
          ))}
          <button 
            onClick={(e) => { e.stopPropagation(); deleteHighlight(highlight.id); }}
            className="p-1 rounded-md text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all ml-auto"
            title="Xóa highlight"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isEditingNote ? (
        <div className="space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
          <Textarea 
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Viết suy nghĩ của bạn về đoạn này..."
            className="text-sm min-h-[80px] bg-background resize-none focus-visible:ring-1 focus-visible:ring-primary/50"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setIsEditingNote(false); }}>
              Hủy
            </Button>
            <Button size="sm" className="h-7 text-xs px-4" onClick={(e) => { e.stopPropagation(); handleSaveNote(); }}>
              Lưu ghi chú
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-1">
          {highlight.note ? (
            <div 
              className="text-sm bg-background/50 p-3 rounded-lg border border-border/40 cursor-text group/note relative"
              onClick={(e) => { e.stopPropagation(); setIsEditingNote(true); }}
            >
              <div className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover/note:opacity-100 transition-opacity bg-muted hover:bg-muted-foreground/10">
                <Edit3 className="w-3 h-3" />
              </div>
              <p className="whitespace-pre-wrap">{highlight.note}</p>
            </div>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditingNote(true); }}
              className="text-xs text-primary/70 hover:text-primary transition-colors flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-md hover:bg-primary/10"
            >
              <Edit3 className="w-3 h-3" />
              Thêm ghi chú...
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const PersonalHighlightsDrawer = ({ open, onOpenChange, bookId, bookSlug: propBookSlug, currentChapterId, chapters }: PersonalHighlightsDrawerProps) => {
  const router = useRouter();
  const { isAuthenticated } = useAppAuth();
  const { data: highlights = [], isLoading } = useGetHighlightsByBookQuery(bookId, {
    skip: !open || !bookId
  });

  const chapterSlugMap = useMemo(() => {
    const map = new Map<string, string>();
    if (chapters) {
      for (const ch of chapters) {
        map.set(ch.id, ch.slug);
      }
    }
    return map;
  }, [chapters]);

  const handleSelectHighlight = (h: UserHighlight) => {
    onOpenChange(false);
    const targetSlug = chapterSlugMap.get(h.chapterId);
    if (!targetSlug || !propBookSlug) return;

    if (h.chapterId === currentChapterId) {
      setTimeout(() => {
        const el = document.getElementById(`paragraph-${h.paragraphId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-primary/20', 'transition-colors', 'duration-500');
          setTimeout(() => el.classList.remove('bg-primary/20'), 2000);
        }
      }, 300);
    } else {
      router.push(`/books/${propBookSlug}/chapters/${targetSlug}#paragraph-${h.paragraphId}`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0 flex flex-col border-l-border">
        <SheetHeader className="p-6 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Highlighter className="w-5 h-5 text-yellow-400" />
              Highlights & Ghi chú
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={`highlight-skeleton-${i}`} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : highlights.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground pt-10">
              {isAuthenticated ? (
                <>
                  <Highlighter className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-medium">Chưa có highlight nào</p>
                  <p className="text-sm mt-1">Hãy bôi đen những câu văn hay khi đọc để lưu lại nhé!</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                    <LogIn className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">Vui lòng đăng nhập</p>
                  <p className="text-sm mt-1">Đăng nhập để xem và tạo highlight khi đọc sách nhé!</p>
                  <Link
                    href="/login"
                    className="mt-4 px-6 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium transition-all hover:scale-105"
                  >
                    Đăng nhập ngay
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {highlights.map(highlight => (
                <HighlightItem key={highlight.id} highlight={highlight} onSelect={handleSelectHighlight} />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
