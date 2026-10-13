import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/modules/reading-rooms/domain/repositories/reading-room.repository.interface';
import { RoomId } from '@/modules/reading-rooms/domain/value-objects/room-id.vo';
import { RemoveHighlightCommand } from './remove-highlight.command';

import { withOptimisticRetry } from '@/shared/application/with-optimistic-retry';

@CommandHandler(RemoveHighlightCommand)
export class RemoveHighlightHandler implements ICommandHandler<
  RemoveHighlightCommand,
  void
> {
  private readonly logger = new Logger(RemoveHighlightHandler.name);

  constructor(private readonly readingRoomRepository: IReadingRoomRepository) {}

  async execute(command: RemoveHighlightCommand): Promise<void> {
    return withOptimisticRetry(async () => {
      const room = await this.readingRoomRepository.findById(
        RoomId.create(command.roomId),
      );

      if (!room) {
        throw new NotFoundDomainException('Phòng không tồn tại');
      }

      room.removeHighlight(command.highlightId, command.userId);
      await this.readingRoomRepository.save(room);

      this.logger.log(
        `Highlight ${command.highlightId} removed from room ${command.roomId} by user ${command.userId}`,
      );
    });
  }
}
