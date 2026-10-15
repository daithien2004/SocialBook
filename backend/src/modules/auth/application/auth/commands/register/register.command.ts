import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class RegisterCommand extends Command<string> {
  constructor(
    public readonly actor: Actor,
    public readonly email: string,
    public readonly username: string,
    public readonly password?: string,
  ) {
    super();
  }
}
