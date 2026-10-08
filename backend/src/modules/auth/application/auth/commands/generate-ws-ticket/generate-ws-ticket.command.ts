import { Command } from '@nestjs/cqrs';

export class GenerateWsTicketCommand extends Command<string> {
  constructor(
    public readonly userId: string,
    public readonly role: string,
  ) {
    super();
  }
}
