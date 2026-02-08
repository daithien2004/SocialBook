import { Types } from 'mongoose';

export class GenreId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): GenreId {
        if (!id || id.trim().length === 0) {
            throw new Error('Genre ID cannot be empty');
        }

        // Validate MongoDB ObjectId format
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Genre ID format');
        }

        return new GenreId(id);
    }

    static generate(): GenreId {
        return new GenreId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    equals(other: GenreId): boolean {
        return this.value === other.value;
    }
}
