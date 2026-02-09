import { LikeId } from '../value-objects/like-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { TargetId } from '../value-objects/target-id.vo';
import { TargetType } from '../value-objects/target-type.vo';
import { Entity } from '../../../shared/domain/entity.base';

export class Like extends Entity<LikeId> {
    private constructor(
        id: LikeId,
        private _userId: UserId,
        private _targetId: TargetId,
        private _targetType: TargetType,
        private _status: boolean,
        createdAt: Date,
        updatedAt: Date
    ) {
        super(id, createdAt, updatedAt);
    }

    static create(props: {
        userId: string;
        targetId: string;
        targetType: TargetType;
        status?: boolean;
    }): Like {
        return new Like(
            LikeId.generate(),
            UserId.create(props.userId),
            TargetId.create(props.targetId),
            props.targetType,
            props.status ?? true,
            new Date(),
            new Date()
        );
    }

    static reconstitute(props: {
        id: string;
        userId: string;
        targetId: string;
        targetType: TargetType;
        status: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): Like {
        return new Like(
            LikeId.create(props.id),
            UserId.create(props.userId),
            TargetId.create(props.targetId),
            props.targetType,
            props.status,
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

    get targetType(): TargetType {
        return this._targetType;
    }

    get status(): boolean {
        return this._status;
    }

    // Business methods
    toggle(): void {
        this._status = !this._status;
        this.markAsUpdated();
    }

    like(): void {
        this._status = true;
        this.markAsUpdated();
    }

    unlike(): void {
        this._status = false;
        this.markAsUpdated();
    }

    isLiked(): boolean {
        return this._status;
    }
}

