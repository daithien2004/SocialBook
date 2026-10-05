import { Command } from '@nestjs/cqrs';

export class DeleteGenreCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}
