import { useEffect, useRef, useCallback } from 'react';
import {
  useUpdateReadingProgressMutation,
  useGetChapterProgressQuery,
} from '@/features/library/api/libraryApi';
import throttle from 'lodash/throttle';

function getContentProgress(contentEl: HTMLElement): number {
  const rect = contentEl.getBoundingClientRect();
  const contentTop = rect.top + window.scrollY;
  const contentHeight = contentEl.offsetHeight;
  const viewportHeight = window.innerHeight;

  const scrolledPast = Math.max(0, window.scrollY - contentTop);
  const totalScrollable = contentHeight - viewportHeight;

  if (totalScrollable <= 0) {
    return window.scrollY >= contentTop ? 100 : 0;
  }
  return Math.min(100, Math.round((scrolledPast / totalScrollable) * 100));
}

function getContentTargetScroll(
  savedProgress: number,
  contentEl: HTMLElement,
): number {
  const rect = contentEl.getBoundingClientRect();
  const contentTop = rect.top + window.scrollY;
  const contentHeight = contentEl.offsetHeight;
  const viewportHeight = window.innerHeight;

  const totalScrollable = contentHeight - viewportHeight;
  if (totalScrollable <= 0) return contentTop;

  return contentTop + (savedProgress / 100) * totalScrollable;
}

export function useReadingProgress(
  bookId: string,
  chapterId: string,
  enabled: boolean = true,
  contentRef?: React.RefObject<HTMLElement | null>,
) {
  const [updateProgress] = useUpdateReadingProgressMutation();
  const { data: progressData, isLoading } = useGetChapterProgressQuery(
    { bookId, chapterId },
    { skip: !enabled || !bookId || !chapterId },
  );

  const lastProgressRef = useRef(0);
  const savedProgress = progressData?.progress || 0;

  const restoreScroll = useCallback(() => {
    if (savedProgress > 0) {
      if (contentRef?.current) {
        const targetScrollY = getContentTargetScroll(savedProgress, contentRef.current);
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      } else {
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const targetScrollY = (savedProgress / 100) * docHeight;
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      }

      lastProgressRef.current = savedProgress;
    }
  }, [savedProgress, contentRef]);

  useEffect(() => {
    if (!enabled || !bookId || !chapterId) return;

    const handleScroll = throttle(() => {
      let progress: number;

      if (contentRef?.current) {
        progress = getContentProgress(contentRef.current);
      } else {
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) return;
        progress = Math.round((scrollTop / docHeight) * 100);
      }

      if (
        Math.abs(progress - lastProgressRef.current) > 5 ||
        progress === 100
      ) {
        lastProgressRef.current = progress;
        updateProgress({ bookId, chapterId, progress });
      }
    }, 1000);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, [bookId, chapterId, enabled, updateProgress, contentRef]);

  return {
    savedProgress,
    isLoadingProgress: isLoading,
    restoreScroll,
  };
}
