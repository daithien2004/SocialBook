
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useUpdateReadingProgressMutation,
  useGetChapterProgressQuery,
} from '@/src/features/library/api/libraryApi';
import { throttle } from 'lodash';

export function useReadingProgress(
  bookId: string,
  chapterId: string,
  enabled: boolean = true
) {
  const [updateProgress] = useUpdateReadingProgressMutation();
  const { data: progressData, isLoading } = useGetChapterProgressQuery(
    { bookId, chapterId },
    { skip: !bookId || !chapterId }
  );

  const lastProgressRef = useRef(0);
  const savedProgress = progressData?.progress || 0;

  const restoreScroll = useCallback(() => {
    if (savedProgress > 0) {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const targetScrollY = (savedProgress / 100) * docHeight;

      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth',
      });

      lastProgressRef.current = savedProgress;
    }
  }, [savedProgress]);

  useEffect(() => {
    if (!enabled || !bookId || !chapterId) return;

    const handleScroll = throttle(() => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight <= 0) return;

      const progress = Math.round((scrollTop / docHeight) * 100);

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
  }, [bookId, chapterId, enabled, updateProgress]);

  return {
    savedProgress,
    isLoadingProgress: isLoading,
    restoreScroll,
  };
}
