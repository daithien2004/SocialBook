'use client';

import { memo, useEffect, useState } from 'react';
import { useReadingRoomStore } from '@/store/useReadingRoomStore';
import type { EmotionEvent } from '@/store/useReadingRoomStore';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * EmotionStream — Live Party Toasts
 * Shows a real-time feed of user reactions as floating bubbles.
 * Ephemeral: items disappear after 3 seconds.
 */
export const EmotionStream = memo(function EmotionStream() {
  const events = useReadingRoomStore((s) => s.emotionEvents);
  const [activeToasts, setActiveToasts] = useState<EmotionEvent[]>([]);

  useEffect(() => {
    // When events change, find the new ones that are very recent
    const now = Date.now();
    const newActive = events.filter(e => now - e.timestamp < 3500).slice(0, 5); // Max 5 toasts
    setActiveToasts(newActive);

    const interval = setInterval(() => {
      const currentNow = Date.now();
      setActiveToasts(prev => prev.filter(e => currentNow - e.timestamp < 3500));
    }, 500);

    return () => clearInterval(interval);
  }, [events]);

  return (
    <div className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 z-[100] pointer-events-none flex flex-col-reverse gap-2 items-start w-64">
      <AnimatePresence>
        {activeToasts.map((event) => (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, x: -20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-background/90 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-border pointer-events-auto cursor-pointer hover:bg-accent transition-colors"
            onClick={() => useReadingRoomStore.getState().setScrollTargetParagraphId(event.paragraphId)}
          >
            <div className="shrink-0 relative">
              {event.avatarUrl ? (
                <img src={event.avatarUrl} alt={event.displayName} className="w-8 h-8 rounded-full object-cover border border-background shadow-sm" />
              ) : (
                <div className="w-8 h-8 rounded-full border border-background shadow-sm bg-primary flex items-center justify-center text-[11px] font-black text-primary-foreground">
                  {event.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Floating emoji animation */}
              <motion.span 
                initial={{ opacity: 0, y: 10, scale: 0 }}
                animate={{ opacity: 1, y: -5, scale: 1.2 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="absolute -top-1 -right-1 text-base drop-shadow-md z-10"
              >
                {event.emoji}
              </motion.span>
            </div>
            
            <div className="flex flex-col min-w-0 py-0.5">
              <p className="text-[10px] leading-tight text-muted-foreground truncate w-36">
                <span className="font-bold text-foreground">{event.displayName}</span>
              </p>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-muted-foreground truncate w-36 italic">
                  &quot;{event.paragraphPreview}&quot;
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
