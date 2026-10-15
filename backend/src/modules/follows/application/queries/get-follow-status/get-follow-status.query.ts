import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export class GetFollowStatusQuery extends Query<{
  userId: string;
  targetId: string;
  isFollowing: boolean;
  isOwner: boolean;
  followId: string | undefined;
}> {
  constructor(
    public readonly actor: Actor,
    public readonly targetId: string,
  ) {
    super();
  }
}
