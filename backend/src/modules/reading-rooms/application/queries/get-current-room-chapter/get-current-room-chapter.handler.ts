import { QueryHandler } from '@nestjs/cqrs';
import type { IQueryHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IChapterReadRepository } from '@/modules/chapters';
import type { ChapterDetailReadModel } from '@/modules/chapters';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import { IReadingRoomReadRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-read.repository';
import { GetCurrentRoomChapterQuery } from './get-current-room-chapter.query';

@QueryHandler(GetCurrentRoomChapterQuery)
export class GetCurrentRoomChapterHandler implements IQueryHandler<
  GetCurrentRoomChapterQuery,
  ChapterDetailReadModel
> {
  constructor(
    private readonly readingRoomReadRepository: IReadingRoomReadRepository,
    private readonly chapterReadRepository: IChapterReadRepository,
  ) {}

  async execute(
    query: GetCurrentRoomChapterQuery,
  ): Promise<ChapterDetailReadModel> {
    const room = await this.readingRoomReadRepository.findDetailsById(
      RoomId.create(query.roomCode).toString(),
    );
    const isActiveMember = room?.members.some(
      (member) =>
        member.userId === query.userId &&
        (member.leftAt === undefined || member.leftAt === null),
    );
    if (!room || room.status !== 'active' || !isActiveMember) {
      throw new NotFoundDomainException('Room chapter is unavailable');
    }

    const chapter = await this.chapterReadRepository.findCurrentRoomChapterById(
      room.bookId,
      room.currentChapterId,
    );
    if (!chapter) {
      throw new NotFoundDomainException('Room chapter is unavailable');
    }

    return chapter;
  }
}
