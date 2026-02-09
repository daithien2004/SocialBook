import { FollowId } from '../value-objects/follow-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { TargetId } from '../value-objects/target-id.vo';
import { FollowStatus } from '../value-objects/follow-status.vo';
import { Entity } from '../../../shared/domain/entity.base';

export class Follow extends Entity<FollowId> {
    private constructor(
        id: FollowId,
        private _userId: UserId,
        private _targetId: TargetId,
        private _status: FollowStatus,
        createdAt: Date,
        updatedAt: Date
    ) {
        super(id, createdAt, updatedAt);
    }

    static create(props: {
        userId: string;
        targetId: string;
        status?: boolean;
    }): Follow {
        const userId = UserId.create(props.userId);
        const targetId = TargetId.create(props.targetId);
        const status = props.status !== undefined ? FollowStatus.create(props.status) : FollowStatus.active();

        if (userId.getValue() === targetId.getValue()) {
            throw new Error('User cannot follow themselves');
        }

        return new Follow(
            FollowId.generate(),
            userId,
            targetId,
            status,
            new Date(),
            new Date()
        );
    }

    static reconstitute(props: {
        id: string;
        userId: string;
        targetId: string;
        status: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): Follow {
        return new Follow(
            FollowId.create(props.id),
            UserId.create(props.userId),
            TargetId.create(props.targetId),
            FollowStatus.create(props.status),
            props.createdAt,
            props.updatedAt
        );
    }

    // Getters
    get userId(): UserId {
        return this._userId;
    }

    get targetId(): TargetId {
        return this._targetId;
    }

    get status(): FollowStatus {
        return this._status;
    }

    // Business methods
    activate(): void {
        this._status = FollowStatus.active();
        this.markAsUpdated();
    }

    deactivate(): void {
        this._status = FollowStatus.inactive();
        this.markAsUpdated();
    }

    toggleStatus(): void {
        this._status = this._status.toggle();
        this.markAsUpdated();
    }

    updateTarget(newTargetId: string): void {
        const targetId = TargetId.create(newTargetId);

        if (this._userId.getValue() === targetId.getValue()) {
            throw new Error('User cannot follow themselves');
        }

        this._targetId = targetId;
        this.markAsUpdated();
    }

    isActive(): boolean {
        return this._status.isActive();
    }

    isInactive(): boolean {
        return this._status.isInactive();
    }

    canBeModified(userId: string): boolean {
        return this._userId.getValue() === userId;
    }

    // Static methods for common operations
    static createFollow(userId: string, targetId: string): Follow {
        return Follow.create({
            userId,
            targetId,
            status: true
        });
    }

    static createUnfollow(userId: string, targetId: string): Follow {
        return Follow.create({
            userId,
            targetId,
            status: false
        });
    }

    // Validation methods
    isValid(): boolean {
        return this._userId.getValue() !== this._targetId.getValue();
    }

    // Helper methods
    getFollowInfo() {
        return {
            id: this.id.toString(),
            userId: this._userId.toString(),
            targetId: this._targetId.toString(),
            status: this._status.getValue(),
            isActive: this.isActive(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

