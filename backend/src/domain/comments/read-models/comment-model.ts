export interface UserSummary {
    id: string;
    name: string;
    image: string;
}
export interface CommentModel {
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
    user: UserSummary;
}