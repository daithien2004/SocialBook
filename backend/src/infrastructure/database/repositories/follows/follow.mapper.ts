import { Follow as FollowEntity } from '@/domain/follows/entities/follow.entity';
import { FollowDocument } from '@/infrastructure/database/schemas/follow.schema';
import { Types } from 'mongoose';

interface FollowPersistence {
  userId: Types.ObjectId;
  targetId: Types.ObjectId;
  status: boolean;
  updatedAt: Date;
}

export class FollowMapper {
  static toDomain(document: FollowDocument | any): FollowEntity {
    return FollowEntity.reconstitute({
      id: document._id.toString(),
      userId: document.userId?.toString() || '',
      targetId: document.targetId?.toString() || '',
      status: document.status,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  static toPersistence(follow: FollowEntity): FollowPersistence {
    return {
      userId: new Types.ObjectId(follow.userId.toString()),
      targetId: new Types.ObjectId(follow.targetId.toString()),
      status: follow.status.getValue(),
      updatedAt: follow.updatedAt,
    };
  }
}
