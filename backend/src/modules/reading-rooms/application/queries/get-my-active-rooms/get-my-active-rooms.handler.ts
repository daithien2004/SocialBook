import { QueryHandler } from '@nestjs/cqrs';
import type { IQueryHandler } from '@nestjs/cqrs';
import { IReadingRoomReadRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-read.repository';
import type { ReadingRoomResult } from '@/modules/reading-rooms/application/reading-room.result';
import type { PageResult } from '@/shared/domain/pagination.types';
import { GetMyActiveRoomsQuery } from './get-my-active-rooms.query';

@QueryHandler(GetMyActiveRoomsQuery)
export class GetMyActiveRoomsHandler implements IQueryHandler<
  GetMyActiveRoomsQuery,
  PageResult<ReadingRoomResult>
> {
  constructor(
    private readonly readingRoomReadRepository: IReadingRoomReadRepository,
  ) {}

  async execute(
    query: GetMyActiveRoomsQuery,
  ): Promise<PageResult<ReadingRoomResult>> {
    return this.readingRoomReadRepository.findActiveSummariesByUser(
      query.userId,
      query.pagination,
    );
  }
}
