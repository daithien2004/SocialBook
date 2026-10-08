import { Query } from '@nestjs/cqrs';
import { Role } from '../../../domain/entities/role.entity';

export class GetRoleByNameQuery extends Query<Role | null> {
  constructor(public readonly name: string) {
    super();
  }
}
