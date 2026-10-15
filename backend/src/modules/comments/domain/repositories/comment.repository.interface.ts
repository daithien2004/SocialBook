import { Comment } from '../entities/comment.entity';
import { CommentDepth } from '../value-objects/comment-depth.vo';
import { CommentId } from '../value-objects/comment-id.vo';
import { CommentTargetType } from '../value-objects/comment-target-type.vo';
import { TargetId } from '../value-objects/target-id.vo';

export interface ParentResolutionResult {
  effectiveParentId: string | null;
  level: CommentDepth;
}

export abstract class ICommentRepository {
  abstract findById(id: CommentId): Promise<Comment | null>;

  abstract save(comment: Comment): Promise<void>;
  abstract delete(id: CommentId): Promise<void>;

  abstract resolveParentId(
    targetId: TargetId,
    targetType: CommentTargetType,
    parentId?: string | null,
  ): Promise<ParentResolutionResult>;
}
