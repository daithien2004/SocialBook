import { QueryHandler } from '@nestjs/cqrs';
import type { IQueryHandler } from '@nestjs/cqrs';
import { IReadingRoomReadRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-read.repository';
import type { ReadingRoomResult } from '@/modules/reading-rooms/application/reading-room.result';
import type { PageResult } from '@/shared/domain/pagination.types';
import { GetMyHistoryQuery } from './get-my-history.query';

@QueryHandler(GetMyHistoryQuery)
export class GetMyHistoryHandler implements IQueryHandler<
  GetMyHistoryQuery,
  PageResult<ReadingRoomResult>
> {
  constructor(
    private readonly readingRoomReadRepository: IReadingRoomReadRepository,
  ) {}

  async execute(
    query: GetMyHistoryQuery,
  ): Promise<PageResult<ReadingRoomResult>> {
    return this.readingRoomReadRepository.findHistorySummariesByUser(
      query.userId,
      query.pagination,
    );
  }
}
