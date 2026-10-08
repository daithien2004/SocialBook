import { Query } from '@nestjs/cqrs';
import { User } from '@/modules/users/domain/users/entities/user.entity';

export class GetUserByIdQuery extends Query<User> {
  constructor(public readonly id: string) {
    super();
  }
}
