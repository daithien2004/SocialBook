import { Types } from 'mongoose';

export class BookId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): BookId {
        if (!id || id.trim().length === 0) {
            throw new Error('Book ID cannot be empty');
        }

        // Validate MongoDB ObjectId format
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Book ID format');
        }

        return new BookId(id);
    }

    toString(): string {
        return this.value;
    }

    equals(other: BookId): boolean {
        return this.value === other.value;
    }

    getValue(): string {
        return this.value;
    }
}
