import { Command } from '@nestjs/cqrs';

export class ResetPasswordCommand extends Command<string> {
  constructor(
    public readonly email: string,
    public readonly otp: string,
    public readonly newPassword: string,
  ) {
    super();
  }
}
