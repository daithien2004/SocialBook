import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IReadingRoomReadRepository } from '../../ports/reading-room-read.repository';
import { ReadingRoomSummaryResult } from '../../reading-room.interface';
import { GetMyHistoryQuery } from './get-my-history.query';

@QueryHandler(GetMyHistoryQuery)
export class GetMyHistoryHandler implements IQueryHandler<
  GetMyHistoryQuery,
  { items: ReadingRoomSummaryResult[]; total: number }
> {
  constructor(
    private readonly readingRoomReadRepository: IReadingRoomReadRepository,
  ) {}

  async execute(
    query: GetMyHistoryQuery,
  ): Promise<{ items: ReadingRoomSummaryResult[]; total: number }> {
    return this.readingRoomReadRepository.findHistorySummariesByUser(
      query.userId,
      { skip: query.skip, limit: query.limit },
    );
  }
}
