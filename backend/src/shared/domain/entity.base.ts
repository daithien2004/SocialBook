export abstract class Entity<ID> {
    protected readonly _id: ID;
    protected readonly _createdAt: Date;
    protected _updatedAt: Date;

    protected constructor(id: ID, createdAt?: Date, updatedAt?: Date) {
        this._id = id;
        this._createdAt = createdAt ?? new Date();
        this._updatedAt = updatedAt ?? new Date();
    }

    get id(): ID {
        return this._id;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    get updatedAt(): Date {
        return this._updatedAt;
    }

    protected markAsUpdated(): void {
        this._updatedAt = new Date();
    }
}
