'use client';

import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PresenceData } from '@/store/useReadingRoomStore';

interface ReaderAvatarsProps {
  paragraphId: string;
  presences: Record<string, PresenceData>;
  currentUserId?: string;
}

export const ReaderAvatars = memo(function ReaderAvatars({
  paragraphId,
  presences,
  currentUserId,
}: ReaderAvatarsProps) {
  const readers = Object.values(presences).filter(
    (p) => p.paragraphId === paragraphId && p.userId !== currentUserId,
  );

  if (readers.length === 0) return null;

  const visible = readers.slice(0, 3);
  const overflow = readers.length - visible.length;

  return (
    <TooltipProvider>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="flex items-center gap-0.5 ml-2 shrink-0 self-start pt-1"
        >
          {visible.map((reader) => (
            <Tooltip key={reader.userId}>
              <TooltipTrigger asChild>
                <motion.div
                  layout
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="relative"
                >
                  {reader.avatarUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                      src={reader.avatarUrl}
                      alt={reader.displayName}
                      width={22}
                      height={22}
                      loading="lazy"
                      className="w-[22px] h-[22px] rounded-full border-2 border-background ring-1 ring-primary/30 object-cover"
                    />
                    </>
                  ) : (
                    <div className="w-[22px] h-[22px] rounded-full border-2 border-background ring-1 ring-primary/30 bg-primary/20 flex items-center justify-center text-[9px] font-black text-primary">
                      {reader.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Reading pulse indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success border border-background" />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[10px] font-bold">
                {reader.displayName} đang đọc đây
              </TooltipContent>
            </Tooltip>
          ))}

          {overflow > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-[22px] h-[22px] rounded-full border-2 border-background bg-muted text-[8px] font-black flex items-center justify-center text-muted-foreground ring-1 ring-border">
                  +{overflow}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[10px] font-bold">
                {overflow} người khác đang đọc đây
              </TooltipContent>
            </Tooltip>
          )}
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  );
});
