import { useCallback, useEffect, useRef } from 'react';
import clientApi from '@/lib/nestjs-client-api';

export enum UserEventType {
  OPEN_BOOK = 'open_book',
  START_READING = 'start_reading',
  READING_PROGRESS = 'reading_progress',
  FINISH_CHAPTER = 'finish_chapter',
  FINISH_BOOK = 'finish_book',
  LIKE_BOOK = 'like_book',
  BOOKMARK_BOOK = 'bookmark_book',
  COMMENT_BOOK = 'comment_book',
  SHARE_BOOK = 'share_book',
  RATE_BOOK = 'rate_book',
  CLOSE_BOOK_EARLY = 'close_book_early',
  SKIP_BOOK = 'skip_book',
  DISLIKE_BOOK = 'dislike_book',
  SEARCH = 'search',
  IMPRESSION = 'impression',
  CLICK_RECOMMENDATION = 'click_recommendation',
}

export interface TrackEventData {
  eventType: UserEventType | string;
  bookId?: string;
  chapterId?: string;
  durationSeconds?: number;
  progressPercent?: number;
  metadata?: Record<string, any>;
  sessionId?: string;
}

export const useTracking = () => {
  const trackEvent = useCallback(async (data: TrackEventData) => {
    try {
      await clientApi.post('/analytics/events', data);
    } catch (error) {
      console.warn('Analytics tracking failed', error);
    }
  }, []);

  const useReadingHeartbeat = (bookId: string, chapterId?: string, intervalSeconds = 60) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (!bookId) return;

      trackEvent({
        eventType: UserEventType.START_READING,
        bookId,
        chapterId,
      });

      timerRef.current = setInterval(() => {
        trackEvent({
          eventType: UserEventType.READING_PROGRESS,
          bookId,
          chapterId,
          durationSeconds: intervalSeconds,
        });
      }, intervalSeconds * 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, [bookId, chapterId, intervalSeconds, trackEvent]);
  };

  return { trackEvent, useReadingHeartbeat };
};
