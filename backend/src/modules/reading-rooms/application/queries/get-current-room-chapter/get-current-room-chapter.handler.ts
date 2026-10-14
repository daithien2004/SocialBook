import { QueryBus, QueryHandler } from '@nestjs/cqrs';
import type { IQueryHandler } from '@nestjs/cqrs';
import { ReadingRoomNotFoundError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { GetReadingRoomChapterQuery } from '@/modules/chapters';
import type { ChapterDetailReadModel } from '@/modules/chapters';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import { ReadingRoomQueryRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-query.repository';
import { GetCurrentRoomChapterQuery } from './get-current-room-chapter.query';

@QueryHandler(GetCurrentRoomChapterQuery)
export class GetCurrentRoomChapterHandler implements IQueryHandler<
  GetCurrentRoomChapterQuery,
  ChapterDetailReadModel
> {
  constructor(
    private readonly readingRoomReadRepository: ReadingRoomQueryRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(
    query: GetCurrentRoomChapterQuery,
  ): Promise<ChapterDetailReadModel> {
    const room = await this.readingRoomReadRepository.findDetailsById(
      RoomId.create(query.roomCode).toString(),
      query.actor.ability,
    );
    const isActiveMember = room?.activeMembers.some(
      (member) => member.userId === query.actor.userId,
    );
    if (!room || room.status !== 'active' || !isActiveMember) {
      throw new ReadingRoomNotFoundError('Requested resource not found.');
    }

    const chapter = await this.queryBus.execute(
      new GetReadingRoomChapterQuery(
        query.actor,
        room.bookId,
        room.currentChapterId,
      ),
    );
    if (!chapter) {
      throw new ReadingRoomNotFoundError('Requested resource not found.');
    }

    return chapter;
  }
}
