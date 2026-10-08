import { Command } from '@nestjs/cqrs';

export class ForgotPasswordCommand extends Command<string> {
  constructor(public readonly email: string) {
    super();
  }
}
