import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class MarkAllNotificationsReadCommand extends Command<void> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
