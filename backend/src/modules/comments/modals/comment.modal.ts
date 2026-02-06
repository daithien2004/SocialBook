import { CommentDocument } from '../schemas/comment.schema';

const toIdString = (id: any): string => {
    if (!id) return '';
    return typeof id === 'string' ? id : id.toString();
};

export class CommentModal {
    id: string;
    content: string;
    targetType: string;
    targetId: string;
    parentId: string | null;
    likesCount: number;
    isFlagged: boolean;
    moderationStatus?: string;
    user?: { id: string; username: string; image?: string };
    createdAt: Date;
    updatedAt: Date;

    constructor(comment: CommentDocument | any) {
        this.id = toIdString(comment._id);
        this.content = comment.content;
        this.targetType = comment.targetType;
        this.targetId = toIdString(comment.targetId);
        this.parentId = comment.parentId ? toIdString(comment.parentId) : null;
        this.likesCount = comment.likesCount || 0;
        this.isFlagged = comment.isFlagged || false;
        this.moderationStatus = comment.moderationStatus;
        this.createdAt = comment.createdAt;
        this.updatedAt = comment.updatedAt;

        // Handle populated user
        if (comment.userId && typeof comment.userId === 'object' && comment.userId.username) {
            this.user = {
                id: toIdString(comment.userId._id),
                username: comment.userId.username,
                image: comment.userId.image,
            };
        }
    }

    static fromArray(comments: (CommentDocument | any)[]): CommentModal[] {
        return comments.map(comment => new CommentModal(comment));
    }
}
