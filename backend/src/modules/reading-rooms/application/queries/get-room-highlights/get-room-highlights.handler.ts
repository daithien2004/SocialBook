import { QueryHandler } from '@nestjs/cqrs';
import type { IQueryHandler } from '@nestjs/cqrs';
import { ReadingRoomNotFoundError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { ReadingRoomQueryRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-query.repository';
import type { GetRoomHighlightsReadModel } from '@/modules/reading-rooms/application/read-models/reading-room.read-model';
import { GetRoomHighlightsQuery } from './get-room-highlights.query';

@QueryHandler(GetRoomHighlightsQuery)
export class GetRoomHighlightsHandler implements IQueryHandler<
  GetRoomHighlightsQuery,
  GetRoomHighlightsReadModel
> {
  constructor(
    private readonly readingRoomReadRepository: ReadingRoomQueryRepository,
  ) {}

  async execute(
    query: GetRoomHighlightsQuery,
  ): Promise<GetRoomHighlightsReadModel> {
    const page = await this.readingRoomReadRepository.findHighlightPage(
      query.code.toUpperCase(),
      query.actor.userId,
      { offset: query.offset, limit: query.limit },
      query.actor.ability,
    );
    if (!page)
      throw new ReadingRoomNotFoundError('Requested resource not found.');
    return page;
  }
}
