import { IsUUID } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { GetFollowStatusQuery } from '../../application/queries/get-follow-status/get-follow-status.query';
import { GetFollowingQuery } from '../../application/queries/get-following-with-user-info/get-following.query';
import { GetFollowersQuery } from '../../application/queries/get-followers-with-user-info/get-followers.query';

export class FollowingQueryDto extends PaginationQueryDto {
  @IsUUID('4')
  userId!: string;

  toQuery(actor: Actor): GetFollowingQuery {
    return new GetFollowingQuery(
      actor,
      this.userId,
      this.actualPage,
      this.actualLimit,
    );
  }
}

export class FollowersQueryDto extends PaginationQueryDto {
  @IsUUID('4')
  targetUserId!: string;

  toQuery(actor: Actor): GetFollowersQuery {
    return new GetFollowersQuery(
      actor,
      this.targetUserId,
      this.actualPage,
      this.actualLimit,
    );
  }
}

export class FollowStatusQueryDto {
  @IsUUID('4')
  targetId!: string;

  toQuery(actor: Actor): GetFollowStatusQuery {
    return new GetFollowStatusQuery(actor, this.targetId);
  }
}
