import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FollowResult } from '@/modules/follows/application/follow.result';

export class FollowResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  targetId: string;

  @ApiProperty()
  status: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  username?: string;

  @ApiPropertyOptional()
  image?: string;

  @ApiPropertyOptional()
  postCount!: number;

  @ApiPropertyOptional()
  readingListCount!: number;

  @ApiPropertyOptional()
  followersCount!: number;

  constructor(
    follow: FollowResult,
    userInfo?: { username?: string; image?: string },
  ) {
    this.id = follow.id;
    this.userId = follow.userId;
    this.targetId = follow.targetId;
    this.status = follow.status;
    this.isActive = follow.isActive;
    this.createdAt = follow.createdAt;
    this.updatedAt = follow.updatedAt;
    this.username = follow.username;
    this.image = follow.image;
    this.postCount = follow.postCount ?? 0;
    this.readingListCount = follow.readingListCount ?? 0;
    this.followersCount = follow.followersCount ?? 0;

    if (userInfo) {
      this.username = userInfo.username;
      this.image = userInfo.image;
    }
  }

  static fromArray(follows: FollowResult[]): FollowResponseDto[] {
    return follows.map((follow) => new FollowResponseDto(follow));
  }
}

export class FollowStatusResponseDto {
  constructor(
    userId: string,
    targetId: string,
    isFollowing: boolean,
    isOwner: boolean,
    followId?: string,
  ) {
    this.userId = userId;
    this.targetId = targetId;
    this.isFollowing = isFollowing;
    this.isOwner = isOwner;
    this.followId = followId;
  }

  @ApiProperty()
  userId: string;

  @ApiProperty()
  targetId: string;

  @ApiProperty()
  isFollowing: boolean;

  @ApiProperty()
  isOwner: boolean;

  @ApiPropertyOptional()
  followId?: string;
}

export class FollowStatsResponseDto {
  @ApiProperty()
  totalFollowing: number;

  @ApiProperty()
  totalFollowers: number;

  @ApiProperty()
  followingCount: number;

  @ApiProperty()
  followersCount: number;

  @ApiProperty({ type: [FollowResponseDto] })
  recentFollows: FollowResponseDto[];

  constructor(
    totalFollowing: number,
    totalFollowers: number,
    followingCount: number,
    followersCount: number,
    recentFollows: FollowResponseDto[],
  ) {
    this.totalFollowing = totalFollowing;
    this.totalFollowers = totalFollowers;
    this.followingCount = followingCount;
    this.followersCount = followersCount;
    this.recentFollows = recentFollows;
  }
}
