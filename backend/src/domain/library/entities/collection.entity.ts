import { Entity } from '@/shared/domain/entity.base';
import { UserId } from '../value-objects/user-id.vo';

export interface CollectionProps {
    userId: UserId;
    name: string;
    description: string;
    isPublic: boolean;
}

export class Collection extends Entity<string> {
    private _props: CollectionProps;

    private constructor(id: string, props: CollectionProps, createdAt?: Date, updatedAt?: Date) {
        super(id, createdAt, updatedAt);
        this._props = props;
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
            {
                userId: UserId.create(props.userId),
                name: props.name,
                description: props.description || '',
                isPublic: props.isPublic || false
            }
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
            {
                userId: UserId.create(props.userId),
                name: props.name,
                description: props.description,
                isPublic: props.isPublic
            },
            props.createdAt,
            props.updatedAt
        );
    }

    get userId(): UserId { return this._props.userId; }
    get name(): string { return this._props.name; }
    get description(): string { return this._props.description; }
    get isPublic(): boolean { return this._props.isPublic; }

    updateInfo(props: {
        name?: string;
        description?: string;
        isPublic?: boolean;
    }): void {
        if (props.name !== undefined) this._props.name = props.name;
        if (props.description !== undefined) this._props.description = props.description;
        if (props.isPublic !== undefined) this._props.isPublic = props.isPublic;
        this.markAsUpdated();
    }
}
