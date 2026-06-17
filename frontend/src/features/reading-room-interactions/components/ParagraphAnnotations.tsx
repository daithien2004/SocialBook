'use client';
import { useState, useRef, useEffect } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { useShallow } from 'zustand/react/shallow';
import { useRoomAnnotations } from '../hooks/useRoomAnnotations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, MessageSquare, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ParagraphAnnotationsProps {
  roomId: string;
  chapterSlug: string;
  paragraphId: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export function ParagraphAnnotations({ roomId, chapterSlug, paragraphId, isOpen: controlledOpen, onToggle }: ParagraphAnnotationsProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
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
        className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer leading-none"
      >
        <MessageCircle size={14} className="text-xs leading-none translate-y-[0.5px]" />
        {commentCount > 0 && (
          <span className="text-[10px] font-medium tabular-nums text-foreground">
            {commentCount}
          </span>
        )}
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
            <div className="mt-2 border border-border/60 rounded-xl bg-card/95 dark:bg-black/60 backdrop-blur-xl shadow-md w-full min-w-0 overflow-hidden ring-1 ring-border/50">
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
                {comments.map((c) => (
                  <div key={c.id} className="w-full">
                    <div className="flex items-baseline gap-1.5 mb-1 ml-1">
                      <span className="font-bold text-[10px] text-primary/80 uppercase tracking-wider">{c.displayName || c.userId.slice(0, 6)}</span>
                    </div>
                    <div className="px-3 py-2.5 rounded-2xl bg-primary/10 dark:bg-primary/10 border border-primary/20 rounded-tl-sm w-fit max-w-[95%]">
                      <p className="text-xs break-words whitespace-pre-wrap leading-relaxed text-foreground">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2.5 border-t border-border/60 bg-muted/40 dark:bg-white/5">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="h-9 text-xs rounded-xl bg-background border-border/50 focus-visible:ring-primary/30 shadow-sm"
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
}
