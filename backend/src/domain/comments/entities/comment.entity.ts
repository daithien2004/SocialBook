import { CommentId } from '../value-objects/comment-id.vo';
import { CommentContent } from '../value-objects/comment-content.vo';
import { UserId } from '../value-objects/user-id.vo';
import { TargetId } from '../value-objects/target-id.vo';
import { CommentTargetType } from '../value-objects/comment-target-type.vo';
import { ModerationStatus } from '../value-objects/moderation-status.vo';
import { Entity } from '../../../shared/domain/entity.base';

export class Comment extends Entity<CommentId> {
    private constructor(
        id: CommentId,
        private _userId: UserId,
        private _targetType: CommentTargetType,
        private _targetId: TargetId,
        private _parentId: CommentId | null,
        private _content: CommentContent,
        private _likesCount: number,
        private _isFlagged: boolean,
        private _moderationReason: string,
        private _moderationStatus: ModerationStatus,
        createdAt: Date,
        updatedAt: Date
    ) {
        super(id, createdAt, updatedAt);
    }

    static create(props: {
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
            CommentId.generate(),
            userId,
            targetType,
            targetId,
            props.parentId ? CommentId.create(props.parentId) : null,
            content,
            props.likesCount || 0,
            props.isFlagged || false,
            props.moderationReason || '',
            moderationStatus,
            new Date(),
            new Date()
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
            UserId.create(props.userId),
            CommentTargetType.create(props.targetType),
            TargetId.create(props.targetId),
            props.parentId ? CommentId.create(props.parentId) : null,
            CommentContent.create(props.content),
            props.likesCount,
            props.isFlagged,
            props.moderationReason,
            ModerationStatus.create(props.moderationStatus),
            props.createdAt,
            props.updatedAt
        );
    }

    // Getters
    get userId(): UserId {
        return this._userId;
    }

    get targetType(): CommentTargetType {
        return this._targetType;
    }

    get targetId(): TargetId {
        return this._targetId;
    }

    get parentId(): CommentId | null {
        return this._parentId;
    }

    get content(): CommentContent {
        return this._content;
    }

    get likesCount(): number {
        return this._likesCount;
    }

    get isFlagged(): boolean {
        return this._isFlagged;
    }

    get moderationReason(): string {
        return this._moderationReason;
    }

    get moderationStatus(): ModerationStatus {
        return this._moderationStatus;
    }

    // Business methods
    updateContent(newContent: string): void {
        this._content = CommentContent.create(newContent);
        this.markAsUpdated();
    }

    updateLikesCount(newLikesCount: number): void {
        this._likesCount = Math.max(0, newLikesCount);
        this.markAsUpdated();
    }

    incrementLikes(): void {
        this._likesCount += 1;
        this.markAsUpdated();
    }

    decrementLikes(): void {
        if (this._likesCount > 0) {
            this._likesCount -= 1;
            this.markAsUpdated();
        }
    }

    flag(reason: string): void {
        this._isFlagged = true;
        this._moderationReason = reason.trim();
        this.markAsUpdated();
    }

    unflag(): void {
        this._isFlagged = false;
        this._moderationReason = '';
        this.markAsUpdated();
    }

    approve(): void {
        this._moderationStatus = ModerationStatus.approved();
        this._isFlagged = false;
        this._moderationReason = '';
        this.markAsUpdated();
    }

    reject(reason: string): void {
        this._moderationStatus = ModerationStatus.rejected();
        this._isFlagged = true;
        this._moderationReason = reason.trim();
        this.markAsUpdated();
    }

    setParent(parentId: string): void {
        this._parentId = CommentId.create(parentId);
        this.markAsUpdated();
    }

    removeParent(): void {
        this._parentId = null;
        this.markAsUpdated();
    }

    changeTarget(newTargetType: string, newTargetId: string): void {
        this._targetType = CommentTargetType.create(newTargetType);
        this._targetId = TargetId.create(newTargetId);
        this.markAsUpdated();
    }

    getContentPreview(maxLength: number = 200): string {
        return this._content.getPreview(maxLength);
    }

    getWordCount(): number {
        return this._content.getWordCount();
    }

    getCharacterCount(): number {
        return this._content.getCharacterCount();
    }

    isReply(): boolean {
        return this._parentId !== null;
    }

    isTopLevel(): boolean {
        return this._parentId === null;
    }

    canBeEdited(userId: string): boolean {
        return this._userId.toString() === userId &&
            this._moderationStatus.isPending();
    }

    canBeDeleted(userId: string): boolean {
        return this._userId.toString() === userId ||
            this._moderationStatus.isRejected();
    }

    // Static methods for common operations
    static createBookComment(userId: string, targetId: string, content: string, parentId?: string): Comment {
        return Comment.create({
            userId,
            targetType: 'book',
            targetId,
            content,
            parentId
        });
    }

    static createChapterComment(userId: string, targetId: string, content: string, parentId?: string): Comment {
        return Comment.create({
            userId,
            targetType: 'chapter',
            targetId,
            content,
            parentId
        });
    }

    static createPostComment(userId: string, targetId: string, content: string, parentId?: string): Comment {
        return Comment.create({
            userId,
            targetType: 'post',
            targetId,
            content,
            parentId
        });
    }

    static createAuthorComment(userId: string, targetId: string, content: string, parentId?: string): Comment {
        return Comment.create({
            userId,
            targetType: 'author',
            targetId,
            content,
            parentId
        });
    }
}

