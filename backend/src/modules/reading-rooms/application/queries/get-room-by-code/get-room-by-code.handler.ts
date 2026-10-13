import { QueryHandler } from '@nestjs/cqrs';
import type { IQueryHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReadingRoomReadRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-read.repository';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import type {
  GetRoomByCodeResult,
  ReadingRoomResult,
} from '@/modules/reading-rooms/application/reading-room.result';

import { GetRoomByCodeQuery } from './get-room-by-code.query';

@QueryHandler(GetRoomByCodeQuery)
export class GetRoomByCodeHandler implements IQueryHandler<
  GetRoomByCodeQuery,
  GetRoomByCodeResult
> {
  constructor(
    private readonly readingRoomReadRepository: IReadingRoomReadRepository,
  ) {}

  async execute(query: GetRoomByCodeQuery): Promise<GetRoomByCodeResult> {
    const room = await this.readingRoomReadRepository.findDetailsById(
      RoomId.create(query.code).toString(),
    );
    if (!room) {
      throw new NotFoundDomainException('Phòng không tồn tại');
    }

    const activeMembers = room.members.filter(
      (member) => member.leftAt === undefined || member.leftAt === null,
    );
    const isMember =
      query.userId !== undefined &&
      activeMembers.some((member) => member.userId === query.userId);
    const roomDetails = {
      roomId: room.roomId,
      bookId: room.bookId,
      mode: room.mode,
      status: room.status,
      currentChapterSlug: room.currentChapterSlug,
      maxMembers: room.maxMembers,
      membersCount: activeMembers.length,
      createdAt: room.createdAt,
    };
    if (!isMember) {
      return {
        ...roomDetails,
        isFull: activeMembers.length >= room.maxMembers,
        isMember: false,
      };
    }

    const full: ReadingRoomResult = {
      ...roomDetails,
      currentChapterId: room.currentChapterId,
      hostId: room.hostId,
      members: activeMembers.map(({ userId, role }) => ({ userId, role })),
    };
    return { ...full, isMember: true };
  }
}
