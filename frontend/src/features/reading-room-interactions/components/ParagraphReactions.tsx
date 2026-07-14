'use client';
import { memo, useRef, useState } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import { useShallow } from 'zustand/react/shallow';
import { useAppAuth } from '@/features/auth/hooks';
import { useRoomReactions } from '../hooks/useRoomReactions';
import { REACTION_META, ReactionType } from '../types/room-interaction.types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ParagraphReactionsProps {
  roomId: string;
  chapterSlug: string;
  paragraphId: string;
}

export const ParagraphReactions = memo(function ParagraphReactions({ roomId, chapterSlug, paragraphId }: ParagraphReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { user } = useAppAuth();
  const reactions = useReadingRoomStore(useShallow((s) => s.reactions[paragraphId]));
  const { addReaction } = useRoomReactions();

  if (!roomId) return null;

  const activeEmoji = (Object.entries(REACTION_META) as [ReactionType, typeof REACTION_META[ReactionType]][]).filter(
    ([type]) => (reactions?.[type]?.length || 0) > 0,
  );

  const handleReact = (type: ReactionType) => {
    addReaction(roomId!, chapterSlug, paragraphId, type);
    setShowPicker(false);
  };

  return (
    <span className="relative inline-flex items-center gap-0.5">
      {activeEmoji.map(([type, meta]) => {
        const count = reactions?.[type]?.length || 0;
        const hasReacted = reactions?.[type]?.includes(user?.id || '') || false;
        return (
          <button
            key={type}
            onClick={() => handleReact(type)}
            className={cn(
              'inline-flex items-center gap-0.5 transition-all hover:scale-110 cursor-pointer leading-none',
              hasReacted ? 'opacity-100' : 'hover:opacity-100',
            )}
            title={meta.label}
          >
            <span className="text-xs leading-none">{meta.emoji}</span>
            <span className="text-[10px] font-medium tabular-nums text-foreground">{count}</span>
          </button>
        );
      })}

      <button
        onClick={() => setShowPicker(!showPicker)}
        className="inline-flex items-center justify-center transition-colors cursor-pointer leading-none text-muted-foreground hover:text-foreground"
      >
        <span className="text-xs leading-none font-medium">+</span>
      </button>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            className="absolute bottom-full left-0 mb-1.5 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-popover border border-border shadow-xl z-50"
          >
            {(Object.entries(REACTION_META) as [ReactionType, typeof REACTION_META[ReactionType]][]).map(([type]) => {
              const hasReacted = reactions?.[type]?.includes(user?.id || '') || false;
              return (
                <button
                  key={type}
                  onClick={() => handleReact(type)}
                  className={cn(
                    'px-1 py-0.5 rounded-full text-base transition-all hover:scale-125 cursor-pointer',
                    hasReacted && 'bg-primary/15 scale-110',
                  )}
                >
                  {REACTION_META[type].emoji}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
});
