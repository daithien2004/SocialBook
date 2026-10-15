import { Query } from '@nestjs/cqrs';
import { TargetType } from '@/modules/likes/domain/value-objects/target-type.vo';
import type { Actor } from '@/shared/casl/actor';
import type { GetLikeCountResult } from '@/modules/likes/application/like.result';
export class GetLikeCountQuery extends Query<GetLikeCountResult> {
  constructor(
    public readonly actor: Actor,
    public readonly targetId: string,
    public readonly targetType: TargetType,
  ) {
    super();
  }
}
