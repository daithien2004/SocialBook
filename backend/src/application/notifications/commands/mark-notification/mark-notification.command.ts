import { Command } from '@nestjs/cqrs';

export class MarkAllNotificationsReadCommand extends Command<unknown> {
  constructor() {
    super();
  }
}
