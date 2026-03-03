import { Like } from '../entities/like.entity';
import { UserId } from '../value-objects/user-id.vo';
import { TargetId } from '../value-objects/target-id.vo';
import { TargetType } from '../value-objects/target-type.vo';

export abstract class ILikeRepository {
    abstract save(like: Like): Promise<void>;
    abstract findByUserAndTarget(userId: UserId, targetId: TargetId, targetType: TargetType): Promise<Like | null>;
    abstract findByTarget(targetId: TargetId, targetType: TargetType): Promise<Like[]>;
    abstract countByTarget(targetId: TargetId, targetType: TargetType): Promise<number>;
    abstract findLikedTargets(userId: UserId, targetIds: TargetId[], targetType: TargetType): Promise<string[]>;
    abstract deleteById(id: string): Promise<void>;
    abstract exists(userId: UserId, targetId: TargetId, targetType: TargetType): Promise<boolean>;
}
