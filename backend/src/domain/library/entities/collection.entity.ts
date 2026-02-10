import { Entity } from '@/shared/domain/entity.base';
import { UserId } from '../value-objects/user-id.vo';

export class Collection extends Entity<string> {
    private constructor(
        id: string,
        private _userId: UserId,
        private _name: string,
        private _description: string,
        private _isPublic: boolean,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id, createdAt, updatedAt);
    }

    static create(props: {
        id: string;
        userId: string;
        name: string;
        description?: string;
        isPublic?: boolean;
    }): Collection {
        return new Collection(
            props.id,
            UserId.create(props.userId),
            props.name,
            props.description || '',
            props.isPublic || false
        );
    }

    static reconstitute(props: {
        id: string;
        userId: string;
        name: string;
        description: string;
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): Collection {
        return new Collection(
            props.id,
            UserId.create(props.userId),
            props.name,
            props.description,
            props.isPublic,
            props.createdAt,
            props.updatedAt
        );
    }

    get userId(): UserId {
        return this._userId;
    }

    get name(): string {
        return this._name;
    }

    get description(): string {
        return this._description;
    }

    get isPublic(): boolean {
        return this._isPublic;
    }

    updateInfo(props: {
        name?: string;
        description?: string;
        isPublic?: boolean;
    }): void {
        if (props.name !== undefined) this._name = props.name;
        if (props.description !== undefined) this._description = props.description;
        if (props.isPublic !== undefined) this._isPublic = props.isPublic;
        this.markAsUpdated();
    }
}
