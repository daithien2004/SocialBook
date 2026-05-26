import { Injectable, Logger } from '@nestjs/common';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';
import { IReadingRoomRepository } from '@/domain/reading-rooms/repositories/reading-room.repository.interface';
import { RoomId } from '@/domain/reading-rooms/value-objects/room-id.vo';
import { RemoveHighlightCommand } from './remove-highlight.command';
import { ReadingRoom } from '@/domain/reading-rooms/entities/reading-room.entity';

@Injectable()
export class RemoveHighlightUseCase {
  private readonly logger = new Logger(RemoveHighlightUseCase.name);

  constructor(private readonly readingRoomRepository: IReadingRoomRepository) {}

  async execute(command: RemoveHighlightCommand): Promise<ReadingRoom> {
    const room = await this.readingRoomRepository.findById(
      RoomId.create(command.roomId),
    );

    if (!room) {
      throw new NotFoundDomainException('Reading room not found');
    }

    room.removeHighlight(command.highlightId, command.userId);
    await this.readingRoomRepository.save(room);

    this.logger.log(
      `Highlight ${command.highlightId} removed from room ${command.roomId} by user ${command.userId}`,
    );

    return room;
  }
}
