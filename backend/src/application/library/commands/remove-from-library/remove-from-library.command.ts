import { Command } from '@nestjs/cqrs';

export class RemoveFromLibraryCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
  ) {
    super();
  }
}
