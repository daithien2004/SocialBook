import { Comment as CommentEntity } from '@/modules/comments/domain/entities/comment.entity';
import { Comment } from '@/core/database/generated/prisma/client';

function moderationStatus(value: string): 'pending' | 'approved' | 'rejected' {
  if (value === 'pending' || value === 'approved' || value === 'rejected') {
    return value;
  }
  throw new Error(`Unsupported comment moderation status: ${value}`);
}

export class CommentMapper {
  static toDomain(row: Comment): CommentEntity {
    return CommentEntity.reconstitute({
      id: row.id,
      userId: row.userId,
      targetType: row.targetType,
      targetId: row.targetId,
      parentId: row.parentId,
      content: row.content,
      likesCount: row.likesCount,
      isFlagged: row.isFlagged,
      moderationReason: row.moderationReason ?? '',
      moderationStatus: moderationStatus(row.moderationStatus),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toCreateInput(comment: CommentEntity) {
    return {
      id: comment.id.toString(),
      userId: comment.userId.toString(),
      targetType: comment.targetType.toString(),
      targetId: comment.targetId.toString(),
      parentId: comment.parentId?.toString() ?? null,
      content: comment.content.toString(),
      likesCount: comment.likesCount,
      isFlagged: comment.isFlagged,
      moderationReason: comment.moderationReason || null,
      moderationStatus: comment.moderationStatus.toString(),
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
