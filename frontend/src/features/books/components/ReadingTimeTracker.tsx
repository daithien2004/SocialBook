'use client';

import { useEffect, useRef } from 'react';
import { useRecordReadingTimeMutation } from '@/features/library/api/libraryApi';
import { useAppAuth } from '@/features/auth/hooks';
import { useTracking, UserEventType } from '@/hooks/use-tracking';


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

  const { trackEvent } = useTracking();

  useEffect(() => {
    if (isAuthenticated && bookId) {
      trackEvent({
        eventType: UserEventType.START_READING,
        bookId,
        chapterId,
      });
    }
  }, [bookId, chapterId, isAuthenticated, trackEvent]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const TICK_INTERVAL = 1000;

    const tick = () => {
       if (document.visibilityState === 'visible') {
          accumulatedSeconds.current += 1;

          if (accumulatedSeconds.current >= 60) {
             const secondsToRecord = 60; 
             accumulatedSeconds.current -= 60;
             
             // Record for library stats
             recordReadingTimeRef.current({
                bookId,
                chapterId,
                durationInSeconds: secondsToRecord
             })
             .catch(console.error);

             // Record for analytics/scoring
             trackEvent({
                eventType: UserEventType.READING_PROGRESS,
                bookId,
                chapterId,
                durationSeconds: secondsToRecord
             });
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
