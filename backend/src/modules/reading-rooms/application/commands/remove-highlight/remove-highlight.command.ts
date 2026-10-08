import { Command } from '@nestjs/cqrs';
import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';

export class RemoveHighlightCommand extends Command<ReadingRoom> {
  constructor(
    public readonly roomId: string,
    public readonly userId: string,
    public readonly highlightId: string,
  ) {
    super();
  }
}
