import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { getContentProgress } from '../utils/reading-progress';

interface ReadingProgressBarProps {
  chapterId: string;
  isControlsVisible: boolean;
  contentRef: RefObject<HTMLElement | null>;
}

export function ReadingProgressBar({ chapterId, isControlsVisible, contentRef }: ReadingProgressBarProps) {
  const [liveProgress, setLiveProgress] = useState(0);

  // chapterId nằm trong deps: khi đổi chương, thanh phải đo lại ngay
  // thay vì giữ số phần trăm của chương trước tới lần scroll kế tiếp.
  useEffect(() => {
    let raf: number | null = null;

    const onScroll = () => {
      if (raf !== null) return;

      raf = requestAnimationFrame(() => {
        raf = null;
        const contentEl = contentRef.current;
        if (!contentEl) return;
        setLiveProgress(getContentProgress(contentEl));
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [contentRef, chapterId]);

  return (
    <div
      className="fixed top-0 left-0 h-1 bg-primary z-[60] transition-all duration-300 ease-out"
      style={{
        width: `${liveProgress}%`,
        opacity: isControlsVisible ? 1 : 0,
      }}
    />
  );
}
