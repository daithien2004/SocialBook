import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class SendOtpCommand extends Command<string> {
  constructor(
    public readonly actor: Actor,
    public readonly email: string,
  ) {
    super();
  }
}
