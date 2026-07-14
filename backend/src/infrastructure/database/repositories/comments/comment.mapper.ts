import { Comment as CommentEntity } from '@/domain/comments/entities/comment.entity';
import { Comment } from '@/infrastructure/database/schemas/comment.schema';
import { Types } from 'mongoose';

export interface CommentReadModelRaw {
  _id: Types.ObjectId;
  content: string;
  targetId: Types.ObjectId;
  targetType: string;
  parentId: Types.ObjectId | null;
  likesCount: number;
  repliesCount?: number;
  isLiked?: boolean;
  isFlagged: boolean;
  moderationStatus: string;
  createdAt: Date;
  updatedAt: Date;
  userId: {
    _id: Types.ObjectId;
    username: string;
    image: string;
  };
}

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
  static toDomain(document: Comment): CommentEntity {
    return CommentEntity.reconstitute({
      id: document._id.toString(),
      userId: document.userId?.toString() || '',
      targetType: document.targetType as 'book' | 'chapter' | 'post' | 'author',
      targetId: document.targetId?.toString() || '',
      parentId: document.parentId?.toString() || null,
      content: document.content,
      likesCount: document.likesCount || 0,
      isFlagged: document.isFlagged || false,
      moderationReason: document.moderationReason || '',
      moderationStatus:
        (document.moderationStatus as 'pending' | 'approved' | 'rejected') ||
        'pending',
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  static toPersistence(comment: CommentEntity): CommentPersistence {
    return {
      userId: new Types.ObjectId(comment.userId.toString()),
      targetType: comment.targetType.toString(),
      targetId: new Types.ObjectId(comment.targetId.toString()),
      parentId: comment.parentId
        ? new Types.ObjectId(comment.parentId.toString())
        : null,
      content: comment.content.toString(),
      likesCount: comment.likesCount,
      isFlagged: comment.isFlagged,
    };
  }
}
