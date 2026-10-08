export class CommentCreatedJobPayload {
  constructor(
    public readonly commentId: string,
    public readonly userId: string,
    public readonly targetId: string,
    public readonly targetType: string,
    public readonly parentId?: string,
  ) {}
}

export class LikeToggledJobPayload {
  constructor(
    public readonly userId: string,
    public readonly targetId: string,
    public readonly targetType: string,
    public readonly isLiked: boolean,
  ) {}
}

export class UserFollowedJobPayload {
  constructor(
    public readonly userId: string,
    public readonly targetId: string,
  ) {}
}

export class PostModeratedJobPayload {
  constructor(
    public readonly userId: string,
    public readonly postId: string,
    public readonly reason: string,
    public readonly action: string,
  ) {}
}
