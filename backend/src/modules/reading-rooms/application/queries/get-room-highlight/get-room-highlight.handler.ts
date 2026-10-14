import { QueryHandler } from '@nestjs/cqrs';
import type { IQueryHandler } from '@nestjs/cqrs';
import { ReadingRoomNotFoundError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import type { ReadingRoomHighlightReadModel } from '@/modules/reading-rooms/application/read-models/reading-room.read-model';
import { ReadingRoomQueryRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-query.repository';
import { GetRoomHighlightQuery } from './get-room-highlight.query';

@QueryHandler(GetRoomHighlightQuery)
export class GetRoomHighlightHandler implements IQueryHandler<
  GetRoomHighlightQuery,
  ReadingRoomHighlightReadModel
> {
  constructor(
    private readonly readingRoomQueryRepository: ReadingRoomQueryRepository,
  ) {}

  async execute(
    query: GetRoomHighlightQuery,
  ): Promise<ReadingRoomHighlightReadModel> {
    const highlight = await this.readingRoomQueryRepository.findHighlightById(
      query.roomId,
      query.highlightId,
      query.actor.userId,
      query.actor.ability,
    );
    if (!highlight) {
      throw new ReadingRoomNotFoundError('Requested resource not found.');
    }
    return highlight;
  }
}
