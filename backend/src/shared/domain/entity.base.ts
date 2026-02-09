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

    public equals(other?: Entity<ID>): boolean {
        if (other === null || other === undefined) {
            return false;
        }

        if (this === other) {
            return true;
        }

        if (!(other instanceof Entity)) {
            return false;
        }

        // Support Value Objects with equals method or primitive comparison
        const thisId = this._id as { equals?: (other: ID) => boolean };
        if (typeof thisId.equals === 'function') {
            return thisId.equals(other._id);
        }

        return this._id === other._id;
    }

    protected markAsUpdated(): void {
        this._updatedAt = new Date();
    }
}
