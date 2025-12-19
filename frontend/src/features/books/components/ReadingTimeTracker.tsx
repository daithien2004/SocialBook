'use client';

import { useEffect, useRef } from 'react';
import { useRecordReadingTimeMutation } from '@/src/features/library/api/libraryApi';
import { useSession } from 'next-auth/react';

interface ReadingTimeTrackerProps {
  bookId: string;
  chapterId: string;
}

const REPORT_INTERVAL = 60000;

export function ReadingTimeTracker({ bookId, chapterId }: ReadingTimeTrackerProps) {
  const { status } = useSession();
  const [recordReadingTime] = useRecordReadingTimeMutation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only track if user is authenticated and window is visible
    if (status !== 'authenticated') return;

    const startTracking = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
         if (document.visibilityState === 'visible') {
            recordReadingTime({
              bookId,
              chapterId,
              durationInSeconds: 60
            }).catch(console.error); 
         }
      }, REPORT_INTERVAL);
    };

    const stopTracking = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startTracking();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startTracking();
      } else {
        stopTracking();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTracking();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [bookId, chapterId, status, recordReadingTime]);

  return null;
}
