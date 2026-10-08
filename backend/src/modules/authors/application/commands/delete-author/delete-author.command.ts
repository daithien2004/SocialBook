import { Command } from '@nestjs/cqrs';

export class DeleteAuthorCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}
