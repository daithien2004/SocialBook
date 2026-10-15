import type { Follow } from '../domain/entities/follow.entity';

export interface FollowResult {
  id: string;
  userId: string;
  targetId: string;
  status: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  username?: string;
  image?: string;
  postCount?: number;
  readingListCount?: number;
  followersCount?: number;
}

export type FollowWithUserInfoResult = FollowResult;

export class FollowResultMapper {
  static fromDomain(follow: Follow): FollowResult {
    return {
      id: follow.id.toString(),
      userId: follow.userId.toString(),
      targetId: follow.targetId.toString(),
      status: follow.status.getValue(),
      isActive: follow.isActive(),
      createdAt: follow.createdAt,
      updatedAt: follow.updatedAt,
    };
  }

  static fromDomainArray(follows: readonly Follow[]): FollowResult[] {
    return follows.map((follow) => this.fromDomain(follow));
  }
}
