'use client';

import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { Highlighter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { RoomHighlightCard } from './RoomHighlightCard';
import { scrollToHighlight, pollAndScroll } from '@/utils/scroll-to-highlight';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInfiniteQuery } from '@tanstack/react-query';
import { readingRoomQueries } from '@/features/reading-rooms/api/reading-rooms.queries';

interface RoomHighlightsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentChapterSlug: string;
  roomCode: string;
}

function RoomHighlightsContent({
  currentChapterSlug,
  roomCode,
  open,
}: {
  currentChapterSlug: string;
  roomCode: string;
  open: boolean;
}) {
  const highlights = useReadingRoomStore((s) => s.highlights);
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      ...readingRoomQueries.highlights(roomCode),
      enabled: open,
    });
  const pagedHighlights = data?.pages.flatMap((page) => page.items) ?? [];
  const visibleHighlights = [
    ...new Map(
      [...pagedHighlights, ...highlights].map((highlight) => [
        highlight.id,
        highlight,
      ]),
    ).values(),
  ];

  const handleJump = (chapterSlug: string, paragraphId: string) => {
    if (currentChapterSlug === chapterSlug) {
      const el = document.querySelector(`[data-para-id="${paragraphId}"]`);
      if (el) {
        scrollToHighlight(el);
      }
    } else {
      router.push(`/reading-rooms/${roomCode}?chapter=${chapterSlug}`);
      pollAndScroll(`[data-para-id="${paragraphId}"]`);
    }
  };

  if (isLoading || (visibleHighlights.length === 0 && isFetchingNextPage)) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Đang tải highlights…
      </div>
    );
  }

  if (visibleHighlights.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground pt-10">
        <Highlighter className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-medium">Chưa có highlight nào</p>
        <p className="text-sm mt-1">
          Hãy bôi đen một đoạn văn và nhấn Highlight để mọi người cùng thấy nhé!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {[...visibleHighlights].reverse().map((h) => (
          <RoomHighlightCard
            key={h.id}
            highlight={h}
            onJump={handleJump}
            className="bg-muted/30"
          />
        ))}
      </AnimatePresence>
      {hasNextPage && (
        <button
          className="w-full text-sm text-primary"
          disabled={isFetchingNextPage}
          onClick={() => void fetchNextPage()}
        >
          {isFetchingNextPage ? 'Đang tải…' : 'Tải thêm highlights'}
        </button>
      )}
    </div>
  );
}

export function RoomHighlightsDrawer({
  open,
  onOpenChange,
  currentChapterSlug,
  roomCode,
}: RoomHighlightsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[450px] p-0 flex flex-col border-l-border"
      >
        <SheetHeader className="p-6 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Highlighter className="w-5 h-5 text-yellow-400" />
              Highlight trong phòng
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <RoomHighlightsContent
            currentChapterSlug={currentChapterSlug}
            roomCode={roomCode}
            open={open}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
