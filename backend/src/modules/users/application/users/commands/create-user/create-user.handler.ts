import { CreateUserCommand } from './create-user.command';
import { CommandHandler } from '@nestjs/cqrs';
import { UserCreationPort } from '@/modules/users/application/user-creation.port';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  constructor(private readonly createUserService: UserCreationPort) {}

  execute(command: CreateUserCommand) {
    return this.createUserService.create(command);
  }
}
