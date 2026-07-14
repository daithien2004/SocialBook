import { Follow as FollowEntity } from '@/domain/follows/entities/follow.entity';
import { FollowDocument } from '@/infrastructure/database/schemas/follow.schema';
import { Types } from 'mongoose';

export interface FollowWithUserInfo {
  id: string;
  userId: string;
  targetId: string;
  status: boolean;
  username: string | undefined;
  image: string | undefined;
  postCount: number;
  readingListCount: number;
  followersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FollowPersistence {
  userId: Types.ObjectId;
  targetId: Types.ObjectId;
  status: boolean;
  isDeleted: boolean;
  updatedAt: Date;
}

export class FollowMapper {
  static toDomain(document: FollowDocument): FollowEntity {
    return FollowEntity.reconstitute({
      id: document._id.toString(),
      userId: document.userId?.toString() || '',
      targetId: document.targetId?.toString() || '',
      status: document.status,
      isDeleted: document.isDeleted || false,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  static toPersistence(follow: FollowEntity): FollowPersistence {
    return {
      userId: new Types.ObjectId(follow.userId.toString()),
      targetId: new Types.ObjectId(follow.targetId.toString()),
      status: follow.status.getValue(),
      isDeleted: follow.isDeleted,
      updatedAt: follow.updatedAt,
    };
  }
}
