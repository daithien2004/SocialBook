import { Query } from '@nestjs/cqrs';
import { User } from '@/domain/users/entities/user.entity';

export class GetUserByIdQuery extends Query<User> {
  constructor(public readonly id: string) {
    super();
  }
}
