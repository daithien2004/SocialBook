import { Follow } from '../../domain/entities/follow.entity';

export class FollowResponseDto {
    constructor(follow: Follow) {
        this.id = follow.id.toString();
        this.userId = follow.userId.toString();
        this.targetId = follow.targetId.toString();
        this.status = follow.status.getValue();
        this.isActive = follow.isActive();
        this.createdAt = follow.createdAt;
        this.updatedAt = follow.updatedAt;
    }

    id: string;
    userId: string;
    targetId: string;
    status: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class FollowStatusResponseDto {
    constructor(userId: string, targetId: string, isFollowing: boolean, isOwner: boolean, followId?: string) {
        this.userId = userId;
        this.targetId = targetId;
        this.isFollowing = isFollowing;
        this.isOwner = isOwner;
        this.followId = followId;
    }

    userId: string;
    targetId: string;
    isFollowing: boolean;
    isOwner: boolean;
    followId?: string;
}

export class FollowStatsResponseDto {
    constructor(
        public totalFollowing: number,
        public totalFollowers: number,
        public followingCount: number,
        public followersCount: number,
        public recentFollows: FollowResponseDto[]
    ) {}
}
