import { Entity } from '@/shared/domain/entity.base';
import { FollowId } from '../value-objects/follow-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { TargetId } from '../value-objects/target-id.vo';
import { FollowStatus } from '../value-objects/follow-status.vo';

export interface FollowProps {
    userId: UserId;
    targetId: TargetId;
    status: FollowStatus;
}

export class Follow extends Entity<FollowId> {
    private _props: FollowProps;

    private constructor(id: FollowId, props: FollowProps, createdAt?: Date, updatedAt?: Date) {
        super(id, createdAt, updatedAt);
        this._props = props;
    }

    static create(props: {
        id: FollowId;
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
            props.id,
            {
                userId,
                targetId,
                status
            }
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
            {
                userId: UserId.create(props.userId),
                targetId: TargetId.create(props.targetId),
                status: FollowStatus.create(props.status)
            },
            props.createdAt,
            props.updatedAt
        );
    }

    // Getters
    get userId(): UserId { return this._props.userId; }
    get targetId(): TargetId { return this._props.targetId; }
    get status(): FollowStatus { return this._props.status; }

    // Business methods
    activate(): void {
        this._props.status = FollowStatus.active();
        this.markAsUpdated();
    }

    deactivate(): void {
        this._props.status = FollowStatus.inactive();
        this.markAsUpdated();
    }

    toggleStatus(): void {
        this._props.status = this._props.status.toggle();
        this.markAsUpdated();
    }

    updateTarget(newTargetId: string): void {
        const targetId = TargetId.create(newTargetId);
        
        if (this._props.userId.getValue() === targetId.getValue()) {
            throw new Error('User cannot follow themselves');
        }

        this._props.targetId = targetId;
        this.markAsUpdated();
    }

    isActive(): boolean {
        return this._props.status.isActive();
    }

    isInactive(): boolean {
        return this._props.status.isInactive();
    }

    canBeModified(userId: string): boolean {
        return this._props.userId.getValue() === userId;
    }

    // Static methods for common operations
    static createFollow(id: FollowId, userId: string, targetId: string): Follow {
        return Follow.create({
            id,
            userId,
            targetId,
            status: true
        });
    }

    static createUnfollow(id: FollowId, userId: string, targetId: string): Follow {
        return Follow.create({
            id,
            userId,
            targetId,
            status: false
        });
    }

    // Validation methods
    isValid(): boolean {
        return this._props.userId.getValue() !== this._props.targetId.getValue();
    }

    // Helper methods
    getFollowInfo() {
        return {
            id: this.id.toString(),
            userId: this._props.userId.toString(),
            targetId: this._props.targetId.toString(),
            status: this._props.status.getValue(),
            isActive: this.isActive(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
