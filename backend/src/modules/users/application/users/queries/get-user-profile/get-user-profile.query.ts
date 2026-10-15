import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { UserProfileOverviewReadModel } from '@/modules/users/application/read-models/user-profile-overview.read-model';

export class GetUserProfileQuery extends Query<UserProfileOverviewReadModel> {
  constructor(
    public readonly actor: Actor,
    public readonly id: string,
  ) {
    super();
  }
}
