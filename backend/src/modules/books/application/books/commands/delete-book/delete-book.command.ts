import { Command } from '@nestjs/cqrs';

export class DeleteBookCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}
