import { Command } from '@nestjs/cqrs';

export class ResendOtpCommand extends Command<{ resendCooldown: number }> {
  constructor(public readonly email: string) {
    super();
  }
}
