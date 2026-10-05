import { Command } from '@nestjs/cqrs';

export class IntelligentSearchCommand extends Command<unknown> {
  constructor() { super(); }
}
