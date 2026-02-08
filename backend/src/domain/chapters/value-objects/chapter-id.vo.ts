import { Types } from 'mongoose';

export class ChapterId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): ChapterId {
        if (!id || id.trim().length === 0) {
            throw new Error('Chapter ID cannot be empty');
        }

        // Validate MongoDB ObjectId format
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Chapter ID format');
        }

        return new ChapterId(id);
    }

    static generate(): ChapterId {
        return new ChapterId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    equals(other: ChapterId): boolean {
        return this.value === other.value;
    }
}
