import { Query } from '@nestjs/cqrs';
import { TargetType } from '@/modules/likes/domain/value-objects/target-type.vo';
import type { Actor } from '@/shared/casl/actor';
import type { GetLikeStatusResult } from '@/modules/likes/application/like.result';
export class GetLikeStatusQuery extends Query<GetLikeStatusResult> {
  constructor(
    public readonly actor: Actor,
    public readonly targetId: string,
    public readonly targetType: TargetType,
  ) {
    super();
  }
}
