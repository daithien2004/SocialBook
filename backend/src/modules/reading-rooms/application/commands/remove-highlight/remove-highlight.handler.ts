import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenError, subject } from '@casl/ability';
import { Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ReadingRoomNotFoundError } from '@/modules/reading-rooms/domain/errors/reading-room.errors';
import { ReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import { RemoveHighlightCommand } from './remove-highlight.command';

import { withOptimisticRetry } from '@/shared/application/with-optimistic-retry';

@CommandHandler(RemoveHighlightCommand)
export class RemoveHighlightHandler implements ICommandHandler<
  RemoveHighlightCommand,
  void
> {
  private readonly logger = new Logger(RemoveHighlightHandler.name);

  constructor(private readonly readingRoomRepository: ReadingRoomRepository) {}

  async execute(command: RemoveHighlightCommand): Promise<void> {
    await withOptimisticRetry(() => this.executeInTransaction(command));
    this.logger.log(
      `Highlight ${command.highlightId} removed from room ${command.roomId} by user ${command.actor.userId}`,
    );
  }

  @Transactional()
  private async executeInTransaction(
    command: RemoveHighlightCommand,
  ): Promise<void> {
    const room = await this.readingRoomRepository.findById(
      RoomId.create(command.roomId),
    );

    if (!room) {
      throw new ReadingRoomNotFoundError('Requested resource not found.');
    }

    const highlight = room.highlights.find(
      (item) => item.id === command.highlightId,
    );
    if (highlight) {
      ForbiddenError.from(command.actor.ability).throwUnlessCan(
        'delete',
        subject('ReadingRoomHighlight', {
          id: highlight.id ?? command.highlightId,
          roomId: room.roomId,
          userId: highlight.userId,
        }),
      );
    }

    room.removeHighlight(command.highlightId);
    await this.readingRoomRepository.save(room);
  }
}
