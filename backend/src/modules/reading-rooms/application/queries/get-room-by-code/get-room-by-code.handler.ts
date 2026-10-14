import { QueryHandler } from '@nestjs/cqrs';
import type { IQueryHandler } from '@nestjs/cqrs';
import { ReadingRoomNotFoundError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { ReadingRoomQueryRepository } from '@/modules/reading-rooms/application/ports/persistence/reading-room-query.repository';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import type {
  GetRoomByCodeReadModel,
  ReadingRoomReadModel,
} from '@/modules/reading-rooms/application/read-models/reading-room.read-model';

import { GetRoomByCodeQuery } from './get-room-by-code.query';

@QueryHandler(GetRoomByCodeQuery)
export class GetRoomByCodeHandler implements IQueryHandler<
  GetRoomByCodeQuery,
  GetRoomByCodeReadModel
> {
  constructor(
    private readonly readingRoomReadRepository: ReadingRoomQueryRepository,
  ) {}

  async execute(query: GetRoomByCodeQuery): Promise<GetRoomByCodeReadModel> {
    const room = await this.readingRoomReadRepository.findDetailsById(
      RoomId.create(query.code).toString(),
      query.actor.ability,
    );
    if (!room) {
      throw new ReadingRoomNotFoundError('Requested resource not found.');
    }

    const isMember = room.activeMembers.some(
      (member) => member.userId === query.actor.userId,
    );
    const roomDetails = {
      roomId: room.roomId,
      bookId: room.bookId,
      mode: room.mode,
      status: room.status,
      currentChapterSlug: room.currentChapterSlug,
      maxMembers: room.maxMembers,
      membersCount: room.activeMembers.length,
      createdAt: room.createdAt,
    };
    if (!isMember) {
      return {
        ...roomDetails,
        isFull: room.activeMembers.length >= room.maxMembers,
        isMember: false,
      };
    }

    const full: ReadingRoomReadModel = {
      ...roomDetails,
      currentChapterId: room.currentChapterId,
      hostId: room.hostId,
      members: room.activeMembers.map(({ userId, role }) => ({ userId, role })),
    };
    return { ...full, isMember: true };
  }
}
