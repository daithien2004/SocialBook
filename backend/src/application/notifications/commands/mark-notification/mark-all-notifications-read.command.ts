import { Command } from '@nestjs/cqrs';

export class MarkAllNotificationsReadCommand extends Command<void> {
  constructor(public readonly userId: string) {
    super();
  }
}
