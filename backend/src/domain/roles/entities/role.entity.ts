import { Entity } from '@/shared/domain/entity.base';

export class Role extends Entity<string> {
    private constructor(
        id: string,
        private _name: string,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        super(id, createdAt, updatedAt);
    }

    get name(): string { return this._name; }

    static create(name: string): Role {
        return new Role(
            crypto.randomUUID(),
            name
        );
    }

    static reconstitute(props: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }): Role {
        return new Role(
            props.id,
            props.name,
            props.createdAt,
            props.updatedAt,
        );
    }

    updateName(name: string): void {
        this._name = name;
        this.markAsUpdated();
    }
}
