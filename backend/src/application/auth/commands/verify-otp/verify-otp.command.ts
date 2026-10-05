import { Command } from '@nestjs/cqrs';

export class VerifyOtpCommand extends Command<string> {
  constructor(
    public readonly email: string,
    public readonly otp: string,
  ) {
    super();
  }
}
