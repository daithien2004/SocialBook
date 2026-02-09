import { Comment as CommentEntity } from '@/domain/comments/entities/comment.entity';
import { CommentDocument } from '@/infrastructure/database/schemas/comment.schema';
import { Types } from 'mongoose';

interface CommentPersistence {
  userId: Types.ObjectId;
  targetType: string;
  targetId: Types.ObjectId;
  parentId: Types.ObjectId | null;
  content: string;
  likesCount: number;
  isFlagged: boolean;
}

export class CommentMapper {
  static toDomain(document: CommentDocument | any): CommentEntity {
    return CommentEntity.reconstitute({
      id: document._id.toString(),
      userId: document.userId?.toString() || '',
      targetType: document.targetType,
      targetId: document.targetId?.toString() || '',
      parentId: document.parentId?.toString() || null,
      content: document.content,
      likesCount: document.likesCount || 0,
      isFlagged: document.isFlagged || false,
      moderationReason: document.moderationReason || '',
      moderationStatus: document.moderationStatus || 'pending',
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  static toPersistence(comment: CommentEntity): CommentPersistence {
    return {
      userId: new Types.ObjectId(comment.userId.toString()),
      targetType: comment.targetType.toString(),
      targetId: new Types.ObjectId(comment.targetId.toString()),
      parentId: comment.parentId ? new Types.ObjectId(comment.parentId.toString()) : null,
      content: comment.content.toString(),
      likesCount: comment.likesCount,
      isFlagged: comment.isFlagged,
    };
  }
}
