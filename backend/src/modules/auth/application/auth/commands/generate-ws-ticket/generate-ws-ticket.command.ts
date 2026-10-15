import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class GenerateWsTicketCommand extends Command<string> {
  constructor(
    public readonly actor: Actor,
    public readonly userId: string,
    public readonly role: string,
  ) {
    super();
  }
}
