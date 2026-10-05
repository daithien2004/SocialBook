import { Command } from '@nestjs/cqrs';

export class RegisterCommand extends Command<string> {
  constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly password?: string,
  ) {
    super();
  }
}
