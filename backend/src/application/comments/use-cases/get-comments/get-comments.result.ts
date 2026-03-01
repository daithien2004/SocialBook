export interface CommentUserResult {
    id: string;
    name: string;
    image: string | null;
}

export interface CommentResult {
    id: string;
    content: string;
    targetId: string;
    targetType: string;
    parentId: string | null;
    likesCount: number;
    isFlagged: boolean;
    moderationStatus: string;
    createdAt: Date;
    updatedAt: Date;
    user: CommentUserResult;
}
