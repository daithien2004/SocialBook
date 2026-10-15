import { Follow as FollowEntity } from '@/modules/follows/domain/entities/follow.entity';
import { Follow } from '@/core/database/generated/prisma/client';

export interface FollowWithUserInfo {
  id: string;
  userId: string;
  targetId: string;
  status: boolean;
  isActive: boolean;
  username: string | undefined;
  image: string | undefined;
  postCount: number;
  readingListCount: number;
  followersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class FollowMapper {
  static toDomain(row: Follow): FollowEntity {
    return FollowEntity.reconstitute({
      id: row.id,
      userId: row.userId,
      targetId: row.targetId,
      status: row.status,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
