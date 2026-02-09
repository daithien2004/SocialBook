import { Types } from 'mongoose';

export class RoleId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): RoleId {
        if (!id || id.trim().length === 0) {
            throw new Error('Role ID cannot be empty');
        }

        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Role ID format');
        }

        return new RoleId(id);
    }

    static generate(): RoleId {
        return new RoleId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    getValue(): string {
        return this.value;
    }

    equals(other: RoleId): boolean {
        return this.value === other.value;
    }
}
