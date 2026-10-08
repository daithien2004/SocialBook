import { Command } from '@nestjs/cqrs';
import { ReadingRoom } from '@/modules/reading-rooms/domain/entities/reading-room.entity';

export class GenerateHighlightInsightCommand extends Command<ReadingRoom> {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
    public readonly highlightId: string,
  ) {
    super();
  }
}
