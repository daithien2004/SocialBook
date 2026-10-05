import { Command } from '@nestjs/cqrs';
export class MarkNotificationReadCommand extends Command<unknown> {
  constructor(
    public readonly userId: string,
    public readonly id: string,
  ) {
    super();
  }
}
