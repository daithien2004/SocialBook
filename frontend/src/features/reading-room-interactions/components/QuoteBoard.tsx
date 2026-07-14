'use client';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { useReadingRoomSocket } from '@/features/reading-rooms/hooks/useReadingRoomSocket';
import { useAppAuth } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, QuoteIcon, ArrowRightCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useDeleteRoomQuoteMutation } from '@/features/reading-room-interactions/api/roomInteractionsApi';
import { useModalStore } from '@/store/useModalStore';
import { toast } from 'sonner';

interface QuoteBoardProps {
  currentChapterSlug: string;
  roomCode: string;
}

export function QuoteBoard({ currentChapterSlug, roomCode }: QuoteBoardProps) {
  const quotes = useReadingRoomStore((s) => s.quotes);
  const room = useReadingRoomStore((s) => s.room);
  const { user } = useAppAuth();
  const { voteQuote, changeChapter } = useReadingRoomSocket();
  const router = useRouter();
  const [deleteRoomQuote, { isLoading: isDeleting }] = useDeleteRoomQuoteMutation();
  const { openConfirm } = useModalStore();

  const handleDeleteQuote = (quoteId: string) => {
    openConfirm({
      title: 'Xóa trích dẫn?',
      description: 'Hành động này không thể hoàn tác.',
      confirmText: 'Xác nhận xóa',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await deleteRoomQuote({ code: roomCode, quoteId }).unwrap();
          useReadingRoomStore.getState().removeQuote(quoteId);
          toast.success('Xóa trích dẫn thành công');
        } catch {
          toast.error('Không thể xóa trích dẫn');
        }
      },
    });
  };

  const handleJumpToQuote = (chapterSlug: string, paragraphId: string) => {
    if (currentChapterSlug === chapterSlug) {
      // Same chapter: just scroll to it
      const el = document.querySelector(`[data-para-id="${paragraphId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary highlight class
        el.classList.add('bg-primary/20', 'transition-colors', 'duration-500', 'rounded-md');
        setTimeout(() => el.classList.remove('bg-primary/20'), 2000);
      } else {
        alert('Không tìm thấy đoạn văn này. Có thể sách đã được cập nhật và đoạn văn bị xóa/thay đổi.');
      }
    } else {
      // Different chapter
      if (room?.mode === 'sync' && room.hostId !== user?.id) {
        // Can't jump chapter in sync mode if not host
        alert('Phòng đang ở chế độ đồng bộ, bạn không thể tự chuyển chương.');
        return;
      }

      // Navigate to the chapter
      if (room?.mode === 'sync' && room.hostId === user?.id) {
        changeChapter(chapterSlug);
      }
      router.push(`/reading-rooms/${roomCode}?chapter=${chapterSlug}`);

      // Wait for new chapter to render then scroll (poll for up to 10 seconds)
      let attempts = 0;
      const maxAttempts = 50; // 50 * 200ms = 10000ms

      const checkAndScroll = setInterval(() => {
        const el = document.querySelector(`[data-para-id="${paragraphId}"]`);
        if (el) {
          clearInterval(checkAndScroll);
          // Small delay to ensure layout is stable
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bg-primary/20', 'transition-colors', 'duration-500', 'rounded-md');
            setTimeout(() => el.classList.remove('bg-primary/20'), 2000);
          }, 100);
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            clearInterval(checkAndScroll);
            alert('Đã chuyển chương nhưng không tìm thấy đoạn văn. Có thể dữ liệu chương chưa tải kịp hoặc đoạn văn không còn tồn tại.');
          }
        }
      }, 200);
    }
  };

  if (quotes.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-muted-foreground italic flex flex-col items-center justify-center opacity-60">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <QuoteIcon className="w-5 h-5 text-primary" />
        </div>
        <p className="font-medium">Chưa có trích dẫn nào</p>
        <p className="text-[10px] mt-1 max-w-[200px]">Hãy bôi đen một đoạn văn tâm đắc và nhấn &quot;Tạo trích dẫn&quot; nhé!</p>
      </div>
    );
  }

  // Sort quotes by votes (highest first), then chronologically
  const sortedQuotes = [...quotes].sort((a, b) => {
    if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className="space-y-3 pb-4">
      <AnimatePresence initial={false}>
        {sortedQuotes.map((quote, index) => {
          const userVote = quote.votes.find((v) => v.userId === user?.id);
          const isTopQuote = index === 0 && quote.voteCount > 0; // Highlight the top voted quote

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              key={quote.id}
              className={cn(
                "group p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                isTopQuote
                  ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                  : "bg-background/40 border-border/50 hover:border-primary/20"
              )}
            >
              {isTopQuote && (
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-wider rounded-bl-lg shadow-sm">
                  Top Trích Dẫn
                </div>
              )}

              <QuoteIcon className="w-6 h-6 absolute top-2 right-2 text-primary/5 -z-10 transform rotate-12 scale-150" />

              <blockquote className="text-xs leading-relaxed text-foreground italic border-l-2 border-primary/40 pl-3 mb-3 relative z-10 font-medium">
                &ldquo;{quote.content}&rdquo;
              </blockquote>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 border-t border-border/50 pt-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground truncate max-w-[100px]">
                    {quote.displayName || quote.userId.slice(0, 6)}
                  </span>

                  <button
                    onClick={() => handleJumpToQuote(quote.chapterSlug, quote.paragraphId)}
                    className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-1"
                    title="Đọc đoạn này"
                  >
                    <ArrowRightCircle className="w-4 h-4" />
                  </button>

                  {(room?.hostId === user?.id || quote.userId === user?.id) && (
                    <button
                      onClick={() => handleDeleteQuote(quote.id)}
                      className="flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 p-1"
                      title="Xóa trích dẫn"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-background/50 rounded-lg p-0.5 shadow-sm border border-border/30">
                  <button
                    onClick={() => voteQuote(quote.id, 'up')}
                    className={cn(
                      'p-1.5 rounded-md hover:bg-primary/15 transition-colors',
                      userVote?.type === 'up' && 'text-success bg-success/10',
                    )}
                    title="Ủng hộ"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <span className={cn(
                    'text-[11px] font-black tabular-nums min-w-[2ch] text-center',
                    quote.voteCount > 0 && 'text-success',
                    quote.voteCount < 0 && 'text-destructive',
                    quote.voteCount === 0 && 'text-foreground'
                  )}>
                    {quote.voteCount > 0 ? `+${quote.voteCount}` : quote.voteCount}
                  </span>
                  <button
                    onClick={() => voteQuote(quote.id, 'down')}
                    className={cn(
                      'p-1.5 rounded-md hover:bg-destructive/15 transition-colors',
                      userVote?.type === 'down' && 'text-destructive bg-destructive/10',
                    )}
                    title="Phản đối"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
