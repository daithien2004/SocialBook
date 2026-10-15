import { Query } from '@nestjs/cqrs';

import type { PublicUserReadModel } from '@/modules/users/application/read-models/public-user.read-model';
import type { PageResult } from '@/shared/domain/pagination.types';
import type { Actor } from '@/shared/casl/actor';
export class SearchUsersQuery extends Query<PageResult<PublicUserReadModel>> {
  constructor(
    public readonly actor: Actor,
    public readonly query: string,
    public readonly page?: number,
    public readonly limit?: number,
  ) {
    super();
  }
}
