import { Types } from 'mongoose';

export class ReadingProgressId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): ReadingProgressId {
        if (!id || id.trim().length === 0) {
            throw new Error('ReadingProgress ID cannot be empty');
        }

        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid ReadingProgress ID format');
        }

        return new ReadingProgressId(id);
    }

    static generate(): ReadingProgressId {
        return new ReadingProgressId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    getValue(): string {
        return this.value;
    }

    equals(other: ReadingProgressId): boolean {
        return this.value === other.value;
    }
}
