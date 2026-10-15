import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class ResetPasswordCommand extends Command<string> {
  constructor(
    public readonly actor: Actor,
    public readonly email: string,
    public readonly otp: string,
    public readonly newPassword: string,
  ) {
    super();
  }
}
