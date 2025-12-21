export interface GetCommentsRequest {
    targetId: string;
    parentId: string | null;
    cursor?: string;
    limit: number;
}

export interface CommentRequest {
    targetId: string;
    targetType: string;
}

export interface PostToggleLikeRequest {
    targetId: string;
    targetType: string;
    parentId: string | null;
    postId: string;
}

export interface PostToggleLikeResponse {
    liked: boolean;
}

export interface GetResolveParentRequest {
    targetId: string;
    parentId: string | null;
    targetType: string;
}

export interface PostCommentsRequest {
    targetId: string;
    parentId: string | null;
    content: string;
    targetType: string;
}

export interface PostCommentsResponse {
    id: string;
    userId: string;
    targetId: string;
    parentId: string | null;
    content: string;
    targetType: string;
}

export interface CommentItem {
    id: string;
    content: string;
    createdAt: string;
    likesCount: number;
    isLiked: boolean;
    repliesCount: number;
    parentId: string | null;
    userId: {
        id: string;
        username: string;
        image?: string;
    } | null;
}

export interface GetCommentsResponse {
    items: CommentItem[];
    nextCursor: string | null;
    hasMore: boolean;
}

export interface ResolveParentResponse {
    parentId: string | null;
    level: number;
}

export interface EditCommentRequest {
    id: string;
    content: string;
    targetId: string;
    parentId?: string | null;
}

export interface EditCommentResponse {
    data: any;
}

export interface DeleteCommentRequest {
    id: string;
    targetId: string;
    parentId?: string | null;
}