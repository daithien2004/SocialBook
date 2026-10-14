import { Command } from '@nestjs/cqrs';

export class DeleteToxicWordCommand extends Command<void> {
  constructor(public readonly id: string) {
    super();
  }
}
