import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class ResendOtpCommand extends Command<{ resendCooldown: number }> {
  constructor(
    public readonly actor: Actor,
    public readonly email: string,
  ) {
    super();
  }
}
