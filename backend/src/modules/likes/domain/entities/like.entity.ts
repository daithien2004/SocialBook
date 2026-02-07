import { UserId } from '../value-objects/user-id.vo';
import { TargetId } from '../value-objects/target-id.vo';
import { TargetType } from '../value-objects/target-type.vo';

export class Like {
    private constructor(
        public readonly id: string,
        private _userId: UserId,
        private _targetId: TargetId,
        private _targetType: TargetType,
        private _status: boolean,
        public readonly createdAt: Date,
        private _updatedAt: Date
    ) {}

    static create(props: {
        userId: string;
        targetId: string;
        targetType: TargetType;
        status?: boolean;
    }): Like {
        return new Like(
            crypto.randomUUID(),
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
            props.id,
            UserId.create(props.userId),
            TargetId.create(props.targetId),
            props.targetType,
            props.status,
            props.createdAt,
            props.updatedAt
        );
    }

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

    get updatedAt(): Date {
        return this._updatedAt;
    }

    toggle(): void {
        this._status = !this._status;
        this._updatedAt = new Date();
    }

    like(): void {
        this._status = true;
        this._updatedAt = new Date();
    }

    unlike(): void {
        this._status = false;
        this._updatedAt = new Date();
    }

    isLiked(): boolean {
        return this._status;
    }
}
