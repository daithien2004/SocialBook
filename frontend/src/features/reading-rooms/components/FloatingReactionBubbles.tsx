'use client';

import { memo, useEffect, useState } from 'react';
import { useReadingRoomStore, EmotionEvent } from '@/store/useReadingRoomStore';
import { AnimatePresence, motion } from 'framer-motion';

interface FloatingReactionBubblesProps {
  paragraphId: string;
}

interface BubbleState extends EmotionEvent {
  // Random horizontal offset for zigzag path
  xOffset: number;
}

/**
 * FloatingReactionBubbles
 * 
 * Sits near a paragraph and listens for recent EmotionEvents matching paragraphId.
 * Creates floating bubbles that zigzag upwards and fade out after 3 seconds.
 */
export const FloatingReactionBubbles = memo(function FloatingReactionBubbles({
  paragraphId,
}: FloatingReactionBubblesProps) {
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);

  // Subscribe to store manually to only extract new events for THIS paragraph
  // and manage their local ephemeral lifecycle (unmounting after 3s).
  useEffect(() => {
    const unsub = useReadingRoomStore.subscribe((state, prevState) => {
      // Find new events that weren't in prevState
      const newEvents = state.emotionEvents.filter(
        (e) => e.paragraphId === paragraphId && !prevState.emotionEvents.some((p) => p.id === e.id)
      );

      if (newEvents.length > 0) {
        setBubbles((prev) => [
          ...prev,
          ...newEvents.map((e) => ({
            ...e,
            // Random x offset between -20px and +20px
            xOffset: Math.floor(Math.random() * 40) - 20,
          })),
        ]);
      }
    });

    return unsub;
  }, [paragraphId]);

  // Cleanup bubbles after they finish animating (3 seconds)
  useEffect(() => {
    if (bubbles.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setBubbles((prev) => prev.filter((b) => now - b.timestamp < 3500));
    }, 1000);

    return () => clearInterval(interval);
  }, [bubbles.length]);

  if (bubbles.length === 0) return null;

  return (
    <div className="absolute bottom-4 -right-16 pointer-events-none z-50 w-16 h-32 flex items-end justify-center overflow-visible">
      <AnimatePresence>
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            initial={{ opacity: 0, y: 10, scale: 0.5, x: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -100, // float up by 100px
              scale: [0.5, 1.2, 1, 1],
              x: [0, bubble.xOffset, -bubble.xOffset, bubble.xOffset / 2], // zigzag
            }}
            transition={{
              duration: 3,
              ease: 'easeOut',
              times: [0, 0.2, 0.8, 1],
            }}
            className="absolute bottom-0 text-2xl filter drop-shadow-md flex items-center justify-center gap-1"
            onAnimationComplete={() => {
              setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
            }}
          >
            {/* Small avatar alongside emoji for context */}
            {bubble.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bubble.avatarUrl}
                alt=""
                className="w-4 h-4 rounded-full object-cover border border-border/50 shadow-sm opacity-80"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-primary/20 border border-border/50 text-[8px] flex items-center justify-center text-primary font-bold shadow-sm opacity-80">
                {bubble.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span>{bubble.emoji}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
