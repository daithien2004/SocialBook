import { Comment as CommentEntity } from '@/domain/comments/entities/comment.entity';
import { CommentDocument } from '@/infrastructure/database/schemas/comment.schema';
import { Types } from 'mongoose';
import { CommentResult } from '@/application/comments/use-cases/get-comments/get-comments.result';

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
  static toDomain(document: any): CommentEntity {
    const isPopulated = document.userId && typeof document.userId === 'object' && !document.userId.toHexString;
    const userIdStr = isPopulated
      ? document.userId._id?.toString() ?? ''
      : document.userId?.toString() ?? '';

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
      (entity as any).userInfo = {
        id: userIdStr,
        name: document.userId.username || 'Unknown',
        image: document.userId.image || null,
      };
    }

    return entity;
  }

  static toResult(entity: CommentEntity): CommentResult {
    const userInfo = (entity as any).userInfo;
    return {
      id: entity.id.toString(),
      content: entity.content.toString(),
      targetId: entity.targetId.toString(),
      targetType: entity.targetType.toString() as any,
      parentId: entity.parentId?.toString() || null,
      likesCount: entity.likesCount,
      isFlagged: entity.isFlagged,
      moderationStatus: entity.moderationStatus.toString() as any,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      user: {
        id: userInfo?.id || entity.userId.toString(),
        name: userInfo?.name || 'Unknown',
        image: userInfo?.image || null,
      },
    };
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
