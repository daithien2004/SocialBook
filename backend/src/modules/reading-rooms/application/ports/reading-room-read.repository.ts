import { ReadingRoomSummaryResult } from '../reading-room.interface';

export abstract class IReadingRoomReadRepository {
  abstract findActiveSummariesByUser(
    userId: string,
  ): Promise<ReadingRoomSummaryResult[]>;

  abstract findHistorySummariesByUser(
    userId: string,
    options?: { skip?: number; limit?: number },
  ): Promise<{ items: ReadingRoomSummaryResult[]; total: number }>;
}
