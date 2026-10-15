import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class VerifyOtpCommand extends Command<string> {
  constructor(
    public readonly actor: Actor,
    public readonly email: string,
    public readonly otp: string,
  ) {
    super();
  }
}
