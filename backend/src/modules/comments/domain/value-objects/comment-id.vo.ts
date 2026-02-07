import { Types } from 'mongoose';

export class CommentId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): CommentId {
        if (!id || id.trim().length === 0) {
            throw new Error('Comment ID cannot be empty');
        }

        // Validate MongoDB ObjectId format
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Comment ID format');
        }

        return new CommentId(id);
    }

    static generate(): CommentId {
        return new CommentId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    equals(other: CommentId): boolean {
        return this.value === other.value;
    }
}
