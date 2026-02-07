import { Types } from 'mongoose';

export class AuthorId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): AuthorId {
        if (!id || id.trim().length === 0) {
            throw new Error('Author ID cannot be empty');
        }

        // Validate MongoDB ObjectId format
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Author ID format');
        }

        return new AuthorId(id);
    }

    static generate(): AuthorId {
        return new AuthorId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    equals(other: AuthorId): boolean {
        return this.value === other.value;
    }
}
