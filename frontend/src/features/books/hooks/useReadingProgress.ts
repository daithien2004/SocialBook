import { useEffect, useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useQuery } from '@tanstack/react-query';
import throttle from 'lodash/throttle';
import { libraryQueries } from '@/features/library/api/library.queries';
import { useUpdateReadingProgress } from '@/features/library/api/library.mutations';
import { getContentProgress, getContentTargetScroll } from '../utils/reading-progress';

const SAVE_PROGRESS_DELTA = 5;
const SAVE_PROGRESS_THROTTLE_MS = 1000;

export function useReadingProgress(
  bookId: string,
  chapterId: string,
  contentRef: RefObject<HTMLElement | null>,
  enabled: boolean = true,
) {
  const { mutate: updateProgressMutate } = useUpdateReadingProgress();
  const { data: progressData, isLoading } = useQuery({
    ...libraryQueries.chapterProgress({ bookId, chapterId }),
    enabled: enabled && !!bookId && !!chapterId,
  });

  const savedProgress = progressData?.progress || 0;

  // Baseline là mốc đã lưu lúc mới mở chương. Chốt đúng 1 lần mỗi chương
  // để refetch không làm đổi baseline (nếu không, mở lại chương sẽ ghi đè mốc cũ).
  const [baselineProgress, setBaselineProgress] = useState(0);
  const baselineChapterRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !chapterId) return;
    if (baselineChapterRef.current === chapterId) return;
    baselineChapterRef.current = chapterId;
    setBaselineProgress(savedProgress);
  }, [chapterId, isLoading, savedProgress]);

  const restoreScroll = useCallback(() => {
    const contentEl = contentRef.current;
    if (savedProgress <= 0 || !contentEl) return;

    window.scrollTo({
      top: getContentTargetScroll(savedProgress, contentEl),
      behavior: 'smooth',
    });
  }, [savedProgress, contentRef]);

  useEffect(() => {
    if (!enabled || !bookId || !chapterId || isLoading) return;

    let lastProgress = baselineProgress;

    const handleScroll = throttle(() => {
      const contentEl = contentRef.current;
      if (!contentEl) return;

      const progress = getContentProgress(contentEl);

      const movedFarEnough = Math.abs(progress - lastProgress) > SAVE_PROGRESS_DELTA;
      const justFinished = progress === 100 && lastProgress !== 100;
      if (!movedFarEnough && !justFinished) return;

      lastProgress = progress;
      updateProgressMutate({ bookId, chapterId, progress });
    }, SAVE_PROGRESS_THROTTLE_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handleScroll.flush();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
      handleScroll.cancel();
    };
  }, [bookId, chapterId, enabled, isLoading, baselineProgress, updateProgressMutate, contentRef]);

  return { savedProgress, restoreScroll };
}
