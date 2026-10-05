import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { RemoveHighlightCommand } from './remove-highlight.command';
import { ReadingRoom } from '@/domain/reading-rooms/entities/reading-room.entity';

import { withOptimisticRetry } from '@/application/shared/utils/with-retries.util';

@CommandHandler(RemoveHighlightCommand)
export class RemoveHighlightHandler implements ICommandHandler<
  RemoveHighlightCommand,
  ReadingRoom
> {
  private readonly logger = new Logger(RemoveHighlightHandler.name);

  constructor(private readonly readingRoomRepository: IReadingRoomRepository) {}

  async execute(command: RemoveHighlightCommand): Promise<ReadingRoom> {
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

      return room;
    });
  }
}
