import { QueryHandler } from '@nestjs/cqrs';
import type { IQueryHandler } from '@nestjs/cqrs';
import { ReadingRoomQueryRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-query.repository';
import type { ReadingRoomReadModel } from '@/modules/reading-rooms/application/read-models/reading-room.read-model';
import type { PageResult } from '@/shared/domain/pagination.types';
import { GetMyHistoryQuery } from './get-my-history.query';

@QueryHandler(GetMyHistoryQuery)
export class GetMyHistoryHandler implements IQueryHandler<
  GetMyHistoryQuery,
  PageResult<ReadingRoomReadModel>
> {
  constructor(
    private readonly readingRoomReadRepository: ReadingRoomQueryRepository,
  ) {}

  async execute(
    query: GetMyHistoryQuery,
  ): Promise<PageResult<ReadingRoomReadModel>> {
    return this.readingRoomReadRepository.findHistorySummariesByUser(
      query.actor.userId,
      query.pagination,
      query.actor.ability,
    );
  }
}
