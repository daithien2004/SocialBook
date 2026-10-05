import { Command } from '@nestjs/cqrs';

export class DeleteBookmarkCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly paragraphId: string,
  ) {
    super();
  }
}
