import { Command } from '@nestjs/cqrs';

export class RemoveHighlightCommand extends Command<void> {
  constructor(
    public readonly roomId: string,
    public readonly userId: string,
    public readonly highlightId: string,
  ) {
    super();
  }
}
