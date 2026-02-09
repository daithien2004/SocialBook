import { Like } from '@/domain/likes/entities/like.entity';
import { LikeDocument } from '@/infrastructure/database/schemas/like.schema';
import { TargetType } from '@/domain/likes/value-objects/target-type.vo';
import { Types } from 'mongoose';

interface LikePersistence {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  targetId: Types.ObjectId;
  targetType: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class LikeMapper {
  static toDomain(doc: LikeDocument | any): Like {
    return Like.reconstitute({
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      targetId: doc.targetId.toString(),
      targetType: doc.targetType as TargetType,
      status: doc.status,
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date
    });
  }

  static toPersistence(like: Like): LikePersistence {
    return {
      _id: new Types.ObjectId(like.id),
      userId: new Types.ObjectId(like.userId.toString()),
      targetId: new Types.ObjectId(like.targetId.toString()),
      targetType: like.targetType,
      status: like.status,
      createdAt: like.createdAt,
      updatedAt: like.updatedAt
    };
  }
}
