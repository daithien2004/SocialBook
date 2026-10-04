import { Command } from '@nestjs/cqrs';
export class GenerateHighlightInsightCommand extends Command<import('@/domain/reading-rooms/entities/reading-room.entity').ReadingRoom> {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
    public readonly highlightId: string,
  ) {
    super();}
}
