import { QueryHandler } from '@nestjs/cqrs';
import type { IQueryHandler } from '@nestjs/cqrs';
import { ReadingRoomQueryRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-query.repository';
import type { ReadingRoomReadModel } from '@/modules/reading-rooms/application/read-models/reading-room.read-model';
import type { PageResult } from '@/shared/domain/pagination.types';
import { GetMyActiveRoomsQuery } from './get-my-active-rooms.query';

@QueryHandler(GetMyActiveRoomsQuery)
export class GetMyActiveRoomsHandler implements IQueryHandler<
  GetMyActiveRoomsQuery,
  PageResult<ReadingRoomReadModel>
> {
  constructor(
    private readonly readingRoomReadRepository: ReadingRoomQueryRepository,
  ) {}

  async execute(
    query: GetMyActiveRoomsQuery,
  ): Promise<PageResult<ReadingRoomReadModel>> {
    return this.readingRoomReadRepository.findActiveSummariesByUser(
      query.actor.userId,
      query.pagination,
      query.actor.ability,
    );
  }
}
