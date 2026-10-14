import { Command } from '@nestjs/cqrs';
export class IncrementPlayCountCommand extends Command<void> {
  constructor(public readonly chapterId: string) {
    super();
  }
}
