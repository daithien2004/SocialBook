import { Query } from '@nestjs/cqrs';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';
import { GetLikeStatusResult } from './get-like-status.handler';
export class GetLikeStatusQuery extends Query<GetLikeStatusResult> {
  constructor(
    public readonly userId: string,
    public readonly targetId: string,
    public readonly targetType: TargetType,
  ) {
    super();
  }
}
