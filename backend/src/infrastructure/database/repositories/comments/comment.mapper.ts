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
    // Khi executeQuery dùng .populate('userId'), document.userId là object
    // Khi không populate, document.userId là ObjectId/string
    const isPopulated = document.userId && typeof document.userId === 'object'
      && !document.userId.toHexString; // ObjectId có toHexString, populated object thì không

    const userIdStr = isPopulated
      ? (document.userId._id ?? document.userId.id)?.toString() || ''
      : document.userId?.toString() || '';

    const entity = CommentEntity.reconstitute({
      id: document._id.toString(),
      userId: userIdStr,
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

    if (isPopulated) {
      (entity as any).__userInfo = {
        id: userIdStr,
        name: document.userId.username || 'Unknown',
        image: document.userId.image || null,
      };
    }

    return entity;
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
