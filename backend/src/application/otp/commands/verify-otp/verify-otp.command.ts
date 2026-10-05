import { Command } from '@nestjs/cqrs';

export class VerifyOtpCommand extends Command<boolean> {
  constructor(
    public readonly email: string,
    public readonly otp: string,
  ) {
    super();
  }
}
