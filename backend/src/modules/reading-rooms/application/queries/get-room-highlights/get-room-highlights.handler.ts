import { QueryHandler } from '@nestjs/cqrs';
import type { IQueryHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReadingRoomReadRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-read.repository';
import type { GetRoomHighlightsResult } from '@/modules/reading-rooms/application/reading-room.result';
import { GetRoomHighlightsQuery } from './get-room-highlights.query';

@QueryHandler(GetRoomHighlightsQuery)
export class GetRoomHighlightsHandler implements IQueryHandler<
  GetRoomHighlightsQuery,
  GetRoomHighlightsResult
> {
  constructor(
    private readonly readingRoomReadRepository: IReadingRoomReadRepository,
  ) {}

  async execute(
    query: GetRoomHighlightsQuery,
  ): Promise<GetRoomHighlightsResult> {
    const page = await this.readingRoomReadRepository.findHighlightPage(
      query.code.toUpperCase(),
      query.userId,
      { offset: query.offset, limit: query.limit },
    );
    if (!page) throw new NotFoundDomainException('Phòng không tồn tại');
    return page;
  }
}
