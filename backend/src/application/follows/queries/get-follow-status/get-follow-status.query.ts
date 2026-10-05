import { Query } from '@nestjs/cqrs';

export class GetFollowStatusQuery extends Query<{
  userId: string;
  targetId: string;
  isFollowing: boolean;
  isOwner: boolean;
  followId: string | undefined;
}> {
  constructor(
    public readonly userId: string,
    public readonly targetId: string,
  ) {
    super();
  }
}
