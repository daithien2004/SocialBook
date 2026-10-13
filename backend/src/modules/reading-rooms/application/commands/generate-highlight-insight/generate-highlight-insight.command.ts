import { Command } from '@nestjs/cqrs';

export class GenerateHighlightInsightCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
    public readonly highlightId: string,
  ) {
    super();
  }
}
