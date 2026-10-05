import { Command } from '@nestjs/cqrs';

export class ClearCollectionCommand extends Command<{ success: boolean }> {
  constructor() {
    super();
  }
}
