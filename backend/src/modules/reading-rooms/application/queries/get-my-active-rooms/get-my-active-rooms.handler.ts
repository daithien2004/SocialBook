import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IReadingRoomReadRepository } from '../../ports/reading-room-read.repository';
import { ReadingRoomSummaryResult } from '../../reading-room.interface';
import { GetMyActiveRoomsQuery } from './get-my-active-rooms.query';

@QueryHandler(GetMyActiveRoomsQuery)
export class GetMyActiveRoomsHandler implements IQueryHandler<
  GetMyActiveRoomsQuery,
  ReadingRoomSummaryResult[]
> {
  constructor(
    private readonly readingRoomReadRepository: IReadingRoomReadRepository,
  ) {}

  async execute(
    query: GetMyActiveRoomsQuery,
  ): Promise<ReadingRoomSummaryResult[]> {
    return this.readingRoomReadRepository.findActiveSummariesByUser(
      query.userId,
    );
  }
}
