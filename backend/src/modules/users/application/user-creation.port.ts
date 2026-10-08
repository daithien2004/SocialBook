import { User } from '@/modules/users/domain/users/entities/user.entity';
import { CreateUserCommand } from './users/commands/create-user/create-user.command';

export abstract class UserCreationPort {
  abstract create(command: CreateUserCommand): Promise<User>;
}
