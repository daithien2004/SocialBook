import { CreateUserCommand } from './create-user.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserCreationPort } from '@/modules/users/application/user-creation.port';
import { ForbiddenError } from '@casl/ability';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly createUserService: UserCreationPort) {}

  @Transactional()
  execute(command: CreateUserCommand) {
    ForbiddenError.from(command.actor.ability).throwUnlessCan('manage', 'User');
    return this.createUserService.create(command);
  }
}
