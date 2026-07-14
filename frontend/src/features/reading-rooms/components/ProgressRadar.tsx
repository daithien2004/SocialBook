'use client';

import { memo } from 'react';
import { useReadingRoomStore, PARTY_COLORS } from '@/store/useReadingRoomStore';
import { useShallow } from 'zustand/react/shallow';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * ProgressRadar
 * 
 * Sits at the top of the reading room and displays a horizontal progress bar
 * showing where every user in the room is located based on their scroll percentage.
 */
export const ProgressRadar = memo(function ProgressRadar() {
  const presences = useReadingRoomStore(
    useShallow((state) => Object.values(state.presences))
  );

  if (presences.length === 0) return null;

  return (
    <div className="w-full bg-background border-b border-border h-8 flex items-center px-4 sticky top-32 sm:top-16 z-[40] shadow-sm transition-all">
      <div className="w-full max-w-4xl mx-auto flex items-center gap-4">
        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap hidden sm:inline-block">
          Tiến độ
        </span>
        <div className="flex-1 relative h-2 bg-muted rounded-full">
          {presences.map((p, idx) => {
            // Assign stable color using hash or just index
            const color = PARTY_COLORS[idx % PARTY_COLORS.length];
            const progressVal = Math.min(Math.max(p.progress || 0, 0), 100);

            return (
              <TooltipProvider key={p.userId} delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background shadow-sm flex items-center justify-center transition-all duration-500 ease-out z-10 hover:z-20 hover:scale-125 cursor-pointer"
                      style={{
                        left: `calc(${progressVal}% - 8px)`,
                        backgroundColor: color.border,
                      }}
                    >
                      {/* Inner dot or initial */}
                      <span className="text-[6px] font-bold text-white uppercase leading-none">
                        {p.displayName.charAt(0)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs py-1 px-2">
                    <span className="font-semibold">{p.displayName}</span>
                    <span className="text-muted-foreground ml-1">
                      ({Math.round(progressVal)}%)
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    </div>
  );
});
