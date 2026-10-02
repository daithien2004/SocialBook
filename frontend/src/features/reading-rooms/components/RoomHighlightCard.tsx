import { motion } from 'framer-motion';
import { Sparkles, MoveRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { RoomHighlight } from '@/store/useReadingRoomStore';

interface RoomHighlightCardProps {
  highlight: RoomHighlight;
  onJump: (chapterSlug: string, paragraphId: string) => void;
  className?: string;
}

export function RoomHighlightCard({ highlight: h, onJump, className = '' }: RoomHighlightCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`group p-3.5 rounded-2xl border border-border/50 hover:border-primary/20 transition-all duration-300 ${className}`}
    >
      <blockquote className="text-xs leading-relaxed text-foreground italic border-l-2 border-yellow-400/60 pl-3 mb-2.5 font-medium">
        &ldquo;{h.content}&rdquo;
      </blockquote>

      {h.aiInsight && (
        <div className="mb-2.5 p-2.5 rounded-xl bg-accent/30 border border-border/40 text-foreground">
          <div className="flex items-center gap-1.5 font-bold text-[10px] mb-1 text-primary">
            <Sparkles className="w-3 h-3" />
            AI PHÂN TÍCH
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {h.aiInsight}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 border-t border-border/50 pt-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-foreground truncate max-w-[100px]">
            {h.displayName || h.user?.displayName || h.userId.slice(0, 6)}
          </span>
          <span className="opacity-50">·</span>
          <span className="truncate">{h.chapterSlug}</span>
          <span className="opacity-50">·</span>
          <span className="shrink-0">
            {format(new Date(h.createdAt), 'dd/MM HH:mm', { locale: vi })}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onJump(h.chapterSlug, h.paragraphId)}
            className="flex items-center justify-center text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-1"
            title="Đi đến đoạn này"
          >
            <MoveRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
