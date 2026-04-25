'use client';

import { useEffect, useRef } from 'react';
import { useRecordReadingTimeMutation } from '@/features/library/api/libraryApi';
import { useAppAuth } from '@/features/auth/hooks';


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
                 // Successfully recorded reading time
             })
             .catch(console.error);
          }
       }
    };

    intervalRef.current = setInterval(tick, TICK_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bookId, chapterId, isAuthenticated]);

  return null;
}
