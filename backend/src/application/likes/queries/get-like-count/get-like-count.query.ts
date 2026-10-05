import { Query } from '@nestjs/cqrs';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';
import { GetLikeCountResult } from './get-like-count.handler';
export class GetLikeCountQuery extends Query<GetLikeCountResult> {
  constructor(
    public readonly targetId: string,
    public readonly targetType: TargetType,
  ) {
    super();
  }
}
