import { Types } from 'mongoose';

export class ReviewId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): ReviewId {
        if (!id || id.trim().length === 0) {
            throw new Error('Review ID cannot be empty');
        }

        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Review ID format');
        }

        return new ReviewId(id);
    }

    static generate(): ReviewId {
        return new ReviewId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    getValue(): string {
        return this.value;
    }

    equals(other: ReviewId): boolean {
        return this.value === other.value;
    }
}
