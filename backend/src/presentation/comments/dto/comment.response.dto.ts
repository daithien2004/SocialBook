import { Comment } from '@/domain/comments/entities/comment.entity';

export class CommentResponseDto {
    id: string;
    user: { id: string; name: string; image: string | null };
    targetType: string;
    targetId: string;
    parentId: string | null;
    content: string;
    likesCount: number;
    isFlagged: boolean;
    moderationReason: string;
    moderationStatus: string;
    createdAt: Date;
    updatedAt: Date;
    contentPreview: string;
    wordCount: number;
    characterCount: number;
    isReply: boolean;
    isTopLevel: boolean;

    constructor(comment: Comment) {
        this.id = comment.id.toString();

        // __userInfo được gắn bởi CommentMapper khi userId đã được populate
        const ui = (comment as any).__userInfo;
        this.user = {
            id: ui?.id || comment.userId.toString(),
            name: ui?.name || 'Unknown',
            image: ui?.image || null,
        };

        this.targetType = comment.targetType.toString();
        this.targetId = comment.targetId.toString();
        this.parentId = comment.parentId?.toString() || null;
        this.content = comment.content.toString();
        this.likesCount = comment.likesCount;
        this.isFlagged = comment.isFlagged;
        this.moderationReason = comment.moderationReason;
        this.moderationStatus = comment.moderationStatus.toString();
        this.createdAt = comment.createdAt;
        this.updatedAt = comment.updatedAt;
        this.contentPreview = comment.getContentPreview();
        this.wordCount = comment.getWordCount();
        this.characterCount = comment.getCharacterCount();
        this.isReply = comment.isReply();
        this.isTopLevel = comment.isTopLevel();
    }

    static fromArray(comments: Comment[]): CommentResponseDto[] {
        return comments.map(comment => new CommentResponseDto(comment));
    }
}

export class CommentWithRepliesDto {
    constructor(comment: Comment, replies: Comment[] = []) {
        this.comment = new CommentResponseDto(comment);
        this.replies = replies.map(reply => new CommentResponseDto(reply));
        this.totalReplies = replies.length;
    }

    comment: CommentResponseDto;
    replies: CommentResponseDto[];
    totalReplies: number;
}

export class CommentStatsDto {
    constructor(
        public totalComments: number,
        public pendingModeration: number,
        public approvedComments: number,
        public rejectedComments: number,
        public flaggedComments: number,
        public commentsByType: Record<string, number>
    ) { }
}

