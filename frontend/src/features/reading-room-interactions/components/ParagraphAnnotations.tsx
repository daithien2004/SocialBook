'use client';
import { memo, useState, useRef, useEffect } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { useShallow } from 'zustand/react/shallow';
import { useRoomAnnotations } from '../hooks/useRoomAnnotations';
import { useAppAuth } from '@/features/auth/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, MessageSquare, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ParagraphAnnotationsProps {
  roomId: string;
  chapterSlug: string;
  paragraphId: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export const ParagraphAnnotations = memo(function ParagraphAnnotations({ roomId, chapterSlug, paragraphId, isOpen: controlledOpen, onToggle }: ParagraphAnnotationsProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const { user } = useAppAuth();
  const setIsOpen = (value: boolean) => {
    setInternalOpen(value);
    onToggle?.(value);
  };
  const [text, setText] = useState('');
  const comments = useReadingRoomStore(useShallow((s) => s.roomComments.filter(
    c => c.paragraphId === paragraphId && !c.parentCommentId,
  )));
  const commentCount = useReadingRoomStore((s) => s.annotations[paragraphId] || 0);
  const { addComment } = useRoomAnnotations();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [comments.length, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addComment(roomId!, chapterSlug, paragraphId, text.trim());
    setText('');
  };

  return (
    <div className="w-full min-w-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center transition-colors cursor-pointer leading-none"
      >
        <span className="inline-flex items-center gap-0.5 rounded-md bg-muted border px-1.5 py-0.5 text-foreground hover:bg-muted/80 transition-colors">
          <MessageCircle size={14} className="text-xs leading-none translate-y-[0.5px]" />
          {commentCount > 0 && (
            <span className="text-xs font-medium tabular-nums">
              {commentCount}
            </span>
          )}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="inline-comments"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 border border-border rounded-xl bg-card/95 dark:bg-muted backdrop-blur-xl shadow-md w-full min-w-0 overflow-hidden ring-1 ring-border">
              <div ref={listRef} className="max-h-56 overflow-y-auto overflow-x-hidden p-3 space-y-3 custom-scrollbar">
                {comments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-[11px] text-center max-w-[200px]">
                      Chưa có bình luận nào cho đoạn này. Hãy là người đầu tiên!
                    </p>
                  </div>
                )}
                {comments.map((c) => {
                  const isMe = c.userId === user?.id;
                  return (
                    <div key={c.id} className={cn('w-full', isMe && 'flex flex-col items-end')}>
                      <div className={cn('flex items-baseline gap-1.5 mb-1', isMe ? 'mr-1' : 'ml-1')}>
                        <span className={cn('font-bold text-[10px] uppercase tracking-wider', isMe ? 'text-foreground/60' : 'text-primary/80')}>{c.displayName || c.userId.slice(0, 6)}</span>
                      </div>
                      <div className={cn(
                        'px-3 py-2.5 rounded-2xl border w-fit max-w-[95%]',
                        isMe
                          ? 'bg-primary text-primary-foreground border-primary/30 rounded-br-sm'
                          : 'bg-primary/10 dark:bg-primary/10 border-primary/20 rounded-tl-sm'
                      )}>
                        <p className={cn('text-xs break-words whitespace-pre-wrap leading-relaxed', isMe ? 'text-primary-foreground' : 'text-foreground')}>{c.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2.5 border-t border-border bg-muted/40 dark:bg-muted/30">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="h-9 text-xs rounded-xl bg-background text-foreground border-border focus-visible:ring-primary/30 shadow-sm"
                />
                <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" disabled={!text.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
