import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, subject } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';
import {
  ReadingRoomNotFoundError,
  ReadingRoomForbiddenError,
  ReadingRoomInvalidError,
} from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { ReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';

import { withOptimisticRetry } from '@/shared/application/with-optimistic-retry';
import { AddHighlightCommand } from './add-highlight.command';

@CommandHandler(AddHighlightCommand)
export class AddHighlightHandler implements ICommandHandler<
  AddHighlightCommand,
  string
> {
  constructor(private readonly readingRoomRepository: ReadingRoomRepository) {}

  async execute(command: AddHighlightCommand): Promise<string> {
    return withOptimisticRetry(() => this.executeInTransaction(command));
  }

  @Transactional()
  private async executeInTransaction(
    command: AddHighlightCommand,
  ): Promise<string> {
    const room = await this.readingRoomRepository.findById(
      RoomId.create(command.roomId),
    );

    if (!room) {
      throw new ReadingRoomNotFoundError('Requested resource not found.');
    }

    ForbiddenError.from(command.actor.ability).throwUnlessCan(
      'update',
      subject('ReadingRoomMember', {
        roomId: room.roomId,
        userId: command.actor.userId,
      }),
    );

    if (room.status === 'ended') {
      throw new ReadingRoomInvalidError('Phòng đã kết thúc');
    }

    if (!room.isMember(command.actor.userId)) {
      throw new ReadingRoomForbiddenError(
        'Bạn không phải là thành viên của phòng này',
      );
    }

    const highlight = room.addHighlight({
      userId: command.actor.userId,
      displayName: command.displayName,
      avatarUrl: command.avatarUrl,
      chapterSlug: command.chapterSlug,
      paragraphId: command.paragraphId,
      content: command.content,
    });

    await this.readingRoomRepository.save(room);

    return highlight.id;
  }
}
