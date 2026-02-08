import { Types } from 'mongoose';

export class FollowId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): FollowId {
        if (!id || id.trim().length === 0) {
            throw new Error('Follow ID cannot be empty');
        }

        // Validate MongoDB ObjectId format
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Follow ID format');
        }

        return new FollowId(id);
    }

    static generate(): FollowId {
        return new FollowId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    equals(other: FollowId): boolean {
        return this.value === other.value;
    }
}
