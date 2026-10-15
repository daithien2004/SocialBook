export interface AnalyticsEventPayload {
  userId: string;
  eventType: string;
  bookId?: string;
  chapterId?: string;
  durationSeconds?: number;
  progressPercent?: number;
  source?: string;
  deviceType?: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
}

export abstract class AnalyticsEventBufferPort {
  abstract append(event: AnalyticsEventPayload): Promise<void>;
  abstract takeAll(): Promise<string[]>;
}
