import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { PostModerationStatsResult } from '@/modules/posts/application/posts/post.result';

export class GetModerationStatsQuery extends Query<PostModerationStatsResult> {
  constructor(public readonly actor: Actor) {
    super();
  }
}
