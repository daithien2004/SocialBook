import { Command } from '@nestjs/cqrs';

export class DeleteChapterCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}
