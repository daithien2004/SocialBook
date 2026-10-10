import { Like } from '../entities/like.entity';
import { TargetId } from '../value-objects/target-id.vo';
import { TargetType } from '../value-objects/target-type.vo';
import { UserId } from '../value-objects/user-id.vo';

export abstract class ILikeRepository {
  abstract save(like: Like): Promise<void>;
  abstract findByUserAndTarget(
    userId: UserId,
    targetId: TargetId,
    targetType: TargetType,
  ): Promise<Like | null>;
  abstract countByTarget(
    targetId: TargetId,
    targetType: TargetType,
  ): Promise<number>;
}
