'use client';

import { memo, useEffect, useState } from 'react';
import { useReadingRoomStore, PARTY_COLORS } from '@/store/useReadingRoomStore';
import { useShallow } from 'zustand/react/shallow';
import { getHighlightRects } from '@/utils/char-offset';

interface RemoteSelectionOverlayProps {
  paragraphId: string;
}

interface HighlightRect {
  userId: string;
  displayName: string;
  colorIndex: number;
  rects: DOMRect[];
  containerRect: DOMRect;
}

/**
 * RemoteSelectionOverlay
 *
 * Renders colored highlight overlays for other users' live selections.
 * Positioned absolutely relative to the paragraph container.
 * pointer-events: none so it doesn't interfere with user interaction.
 */
export const RemoteSelectionOverlay = memo(function RemoteSelectionOverlay({
  paragraphId,
}: RemoteSelectionOverlayProps) {
  const selections = useReadingRoomStore(
    useShallow((s) =>
      Object.values(s.remoteSelections).filter((sel) => sel.paragraphId === paragraphId),
    ),
  );

  const [highlights, setHighlights] = useState<HighlightRect[]>([]);

  // Recalculate pixel positions whenever selections or container change
  useEffect(() => {
    let active = true;

    const calculate = () => {
      // Find the paragraph container using its DOM ID (prefixed as set in ChapterContent)
      const container = document.getElementById(`paragraph-${paragraphId}`);
      if (!container || selections.length === 0) {
        if (active) setHighlights([]);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const computed: HighlightRect[] = [];

      for (const sel of selections) {
        const rects = getHighlightRects(container, sel.startOffset, sel.endOffset);
        if (rects.length > 0) {
          computed.push({
            userId: sel.userId,
            displayName: sel.displayName,
            colorIndex: sel.colorIndex,
            rects,
            containerRect,
          });
        }
      }

      if (active) setHighlights(computed);
    };

    // Use RAF to ensure DOM layout is complete and bypass sync setState lint rule
    const rafId = requestAnimationFrame(calculate);

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
    };
  }, [selections, paragraphId]);

  if (highlights.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 5 }}
    >
      {highlights.map(({ userId, displayName, colorIndex, rects, containerRect }) => {
        const color = PARTY_COLORS[colorIndex % PARTY_COLORS.length];
        return rects.map((rect, i) => (
          <div
            key={`${userId}-${i}`}
            style={{
              position: 'absolute',
              top: rect.top - containerRect.top,
              left: rect.left - containerRect.left,
              width: rect.width,
              height: rect.height,
              backgroundColor: color.bg,
              borderBottom: `2px solid ${color.border}`,
              borderRadius: 2,
              transition: 'all 150ms ease',
            }}
            title={`${displayName} đang đọc`}
          />
        ));
      })}
    </div>
  );
});
