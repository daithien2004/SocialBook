import { Command } from '@nestjs/cqrs';

export class RecordSearchCommand extends Command<void> {
  constructor(public readonly keyword: string) {
    super();
  }
}
