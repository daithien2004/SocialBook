import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { IReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import { GetRoomHighlightsQuery } from './get-room-highlights.query';

@QueryHandler(GetRoomHighlightsQuery)
export class GetRoomHighlightsHandler implements IQueryHandler<GetRoomHighlightsQuery> {
  constructor(private readonly readingRoomRepository: IReadingRoomRepository) {}

  async execute(query: GetRoomHighlightsQuery) {
    const page = await this.readingRoomRepository.findHighlightPage(
      RoomId.create(query.code.toUpperCase()),
      query.userId,
      query.offset,
      query.limit,
    );
    if (!page) throw new NotFoundException('Phòng không tồn tại');
    return page;
  }
}
