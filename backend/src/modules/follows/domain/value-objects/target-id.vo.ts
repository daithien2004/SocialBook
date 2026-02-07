import { Types } from 'mongoose';

export class TargetId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): TargetId {
        if (!id || id.trim().length === 0) {
            throw new Error('Target ID cannot be empty');
        }

        // Validate MongoDB ObjectId format
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Target ID format');
        }

        return new TargetId(id);
    }

    toString(): string {
        return this.value;
    }

    equals(other: TargetId): boolean {
        return this.value === other.value;
    }

    getValue(): string {
        return this.value;
    }
}
