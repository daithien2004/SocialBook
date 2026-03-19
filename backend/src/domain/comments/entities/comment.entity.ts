import { Entity } from '@/shared/domain/entity.base';
import { CommentId } from '../value-objects/comment-id.vo';
import { CommentContent } from '../value-objects/comment-content.vo';
import { UserId } from '../value-objects/user-id.vo';
import { TargetId } from '../value-objects/target-id.vo';
import { CommentTargetType } from '../value-objects/comment-target-type.vo';
import { ModerationStatus } from '../value-objects/moderation-status.vo';

export interface CommentProps {
    userId: UserId;
    targetType: CommentTargetType;
    targetId: TargetId;
    parentId: CommentId | null;
    content: CommentContent;
    likesCount: number;
    isFlagged: boolean;
    moderationReason: string;
    moderationStatus: ModerationStatus;
}

export class Comment extends Entity<CommentId> {
    private _props: CommentProps;

    private constructor(id: CommentId, props: CommentProps, createdAt?: Date, updatedAt?: Date) {
        super(id, createdAt, updatedAt);
        this._props = props;
    }

    static create(props: {
        id: CommentId;
        userId: string;
        targetType: 'book' | 'chapter' | 'post' | 'author';
        targetId: string;
        parentId?: string;
        content: string;
        likesCount?: number;
        isFlagged?: boolean;
        moderationReason?: string;
        moderationStatus?: 'pending' | 'approved' | 'rejected';
    }): Comment {
        const userId = UserId.create(props.userId);
        const targetType = CommentTargetType.create(props.targetType);
        const targetId = TargetId.create(props.targetId);
        const content = CommentContent.create(props.content);
        const moderationStatus = props.moderationStatus ?
            ModerationStatus.create(props.moderationStatus) :
            ModerationStatus.pending();

        return new Comment(
            props.id,
            {
                userId,
                targetType,
                targetId,
                parentId: props.parentId ? CommentId.create(props.parentId) : null,
                content,
                likesCount: props.likesCount || 0,
                isFlagged: props.isFlagged || false,
                moderationReason: props.moderationReason || '',
                moderationStatus
            }
        );
    }

    static reconstitute(props: {
        id: string;
        userId: string;
        targetType: 'book' | 'chapter' | 'post' | 'author';
        targetId: string;
        parentId: string | null;
        content: string;
        likesCount: number;
        isFlagged: boolean;
        moderationReason: string;
        moderationStatus: 'pending' | 'approved' | 'rejected';
        createdAt: Date;
        updatedAt: Date;
    }): Comment {
        return new Comment(
            CommentId.create(props.id),
            {
                userId: UserId.create(props.userId),
                targetType: CommentTargetType.create(props.targetType),
                targetId: TargetId.create(props.targetId),
                parentId: props.parentId ? CommentId.create(props.parentId) : null,
                content: CommentContent.create(props.content),
                likesCount: props.likesCount,
                isFlagged: props.isFlagged,
                moderationReason: props.moderationReason,
                moderationStatus: ModerationStatus.create(props.moderationStatus)
            },
            props.createdAt,
            props.updatedAt
        );
    }

    // Getters
    get userId(): UserId { return this._props.userId; }
    get targetType(): CommentTargetType { return this._props.targetType; }
    get targetId(): TargetId { return this._props.targetId; }
    get parentId(): CommentId | null { return this._props.parentId; }
    get content(): CommentContent { return this._props.content; }
    get likesCount(): number { return this._props.likesCount; }
    get isFlagged(): boolean { return this._props.isFlagged; }
    get moderationReason(): string { return this._props.moderationReason; }
    get moderationStatus(): ModerationStatus { return this._props.moderationStatus; }

    // Business methods
    updateContent(newContent: string): void {
        this._props.content = CommentContent.create(newContent);
        this.markAsUpdated();
    }

    updateLikesCount(newLikesCount: number): void {
        this._props.likesCount = Math.max(0, newLikesCount);
        this.markAsUpdated();
    }

    incrementLikes(): void {
        this._props.likesCount += 1;
        this.markAsUpdated();
    }

    decrementLikes(): void {
        if (this._props.likesCount > 0) {
            this._props.likesCount -= 1;
            this.markAsUpdated();
        }
    }

    flag(reason: string): void {
        this._props.isFlagged = true;
        this._props.moderationReason = reason.trim();
        this.markAsUpdated();
    }

    unflag(): void {
        this._props.isFlagged = false;
        this._props.moderationReason = '';
        this.markAsUpdated();
    }

    approve(): void {
        this._props.moderationStatus = ModerationStatus.approved();
        this._props.isFlagged = false;
        this._props.moderationReason = '';
        this.markAsUpdated();
    }

    reject(reason: string): void {
        this._props.moderationStatus = ModerationStatus.rejected();
        this._props.isFlagged = true;
        this._props.moderationReason = reason.trim();
        this.markAsUpdated();
    }

    setParent(parentId: string): void {
        this._props.parentId = CommentId.create(parentId);
        this.markAsUpdated();
    }

    removeParent(): void {
        this._props.parentId = null;
        this.markAsUpdated();
    }

    changeTarget(newTargetType: string, newTargetId: string): void {
        this._props.targetType = CommentTargetType.create(newTargetType);
        this._props.targetId = TargetId.create(newTargetId);
        this.markAsUpdated();
    }

    getContentPreview(maxLength: number = 200): string {
        return this._props.content.getPreview(maxLength);
    }

    getWordCount(): number {
        return this._props.content.getWordCount();
    }

    getCharacterCount(): number {
        return this._props.content.getCharacterCount();
    }

    isReply(): boolean {
        return this._props.parentId !== null;
    }

    isTopLevel(): boolean {
        return this._props.parentId === null;
    }

    canBeEdited(userId: string): boolean {
        return this._props.userId.toString() === userId &&
            this._props.moderationStatus.isPending();
    }

    canBeDeleted(userId: string): boolean {
        return this._props.userId.toString() === userId ||
            this._props.moderationStatus.isRejected();
    }

    // Static methods for common operations
    static createBookComment(id: CommentId, userId: string, targetId: string, content: string, parentId?: string): Comment {
        return Comment.create({
            id,
            userId,
            targetType: 'book',
            targetId,
            content,
            parentId
        });
    }

    static createChapterComment(id: CommentId, userId: string, targetId: string, content: string, parentId?: string): Comment {
        return Comment.create({
            id,
            userId,
            targetType: 'chapter',
            targetId,
            content,
            parentId
        });
    }

    static createPostComment(id: CommentId, userId: string, targetId: string, content: string, parentId?: string): Comment {
        return Comment.create({
            id,
            userId,
            targetType: 'post',
            targetId,
            content,
            parentId
        });
    }

    static createAuthorComment(id: CommentId, userId: string, targetId: string, content: string, parentId?: string): Comment {
        return Comment.create({
            id,
            userId,
            targetType: 'author',
            targetId,
            content,
            parentId
        });
    }
}
