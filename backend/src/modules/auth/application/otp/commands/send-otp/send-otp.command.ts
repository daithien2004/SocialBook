import { Command } from '@nestjs/cqrs';

export class SendOtpCommand extends Command<string> {
  constructor(public readonly email: string) {
    super();
  }
}
