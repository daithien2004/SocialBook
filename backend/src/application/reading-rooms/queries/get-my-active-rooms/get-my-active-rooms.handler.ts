import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { ReadingRoomApplicationMapper } from '../../mappers/reading-room.mapper';
import { ReadingRoomResult } from '../../reading-room.interface';
import { GetMyActiveRoomsQuery } from './get-my-active-rooms.query';

@QueryHandler(GetMyActiveRoomsQuery)
export class GetMyActiveRoomsHandler implements IQueryHandler<
  GetMyActiveRoomsQuery,
  ReadingRoomResult[]
> {
  constructor(private readonly readingRoomRepository: IReadingRoomRepository) {}

  async execute(query: GetMyActiveRoomsQuery): Promise<ReadingRoomResult[]> {
    const rooms = await this.readingRoomRepository.findActiveByUser(
      query.userId,
    );
    return ReadingRoomApplicationMapper.toResultArray(rooms);
  }
}
