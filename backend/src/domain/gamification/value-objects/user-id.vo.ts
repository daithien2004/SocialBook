import { Types } from 'mongoose';

export class UserId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): UserId {
        if (!id || id.trim().length === 0) {
            throw new Error('User ID cannot be empty');
        }
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid User ID format');
        }
        return new UserId(id);
    }

    toString(): string {
        return this.value;
    }

    equals(other: UserId): boolean {
        return this.value === other.value;
    }

    getValue(): string {
        return this.value;
    }
}
