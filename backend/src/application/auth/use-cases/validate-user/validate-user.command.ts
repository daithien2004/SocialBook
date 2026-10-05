import { Command } from '@nestjs/cqrs';

export class ValidateUserCommand extends Command<any> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
