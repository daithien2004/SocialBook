'use client';

import { useEffect, useRef } from 'react';
import { useRecordReadingTimeMutation } from '@/src/features/library/api/libraryApi';
import { useAppAuth } from '@/src/hooks/useAppAuth';
import { useDispatch } from 'react-redux';
import { gamificationApi } from '@/src/features/gamification/api/gamificationApi';

interface ReadingTimeTrackerProps {
  bookId: string;
  chapterId: string;
}

export function ReadingTimeTracker({ bookId, chapterId }: ReadingTimeTrackerProps) {
  const { isAuthenticated } = useAppAuth();
  const [recordReadingTime] = useRecordReadingTimeMutation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const accumulatedSeconds = useRef(0);

  const recordReadingTimeRef = useRef(recordReadingTime);
  const dispatch = useDispatch();

  useEffect(() => {
    recordReadingTimeRef.current = recordReadingTime;
  }, [recordReadingTime]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const TICK_INTERVAL = 1000;

    const tick = () => {
       if (document.visibilityState === 'visible') {
          accumulatedSeconds.current += 1;

          if (accumulatedSeconds.current >= 60) {
             const secondsToRecord = 60; 
             accumulatedSeconds.current -= 60;
             
             recordReadingTimeRef.current({
                bookId,
                chapterId,
                durationInSeconds: secondsToRecord
             })
             .then((result) => {
                 if ('data' in result) {
                     dispatch(gamificationApi.util.invalidateTags(['DailyGoals', 'GamificationStats']));
                 }
             })
             .catch(console.error);
          }
       }
    };

    intervalRef.current = setInterval(tick, TICK_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bookId, chapterId, isAuthenticated, dispatch]);

  return null;
}
