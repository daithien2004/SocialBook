import { Command } from '@nestjs/cqrs';

export class LogoutCommand extends Command<{ message: string }> {
  constructor(public readonly userId: string) {
    super();
  }
}
