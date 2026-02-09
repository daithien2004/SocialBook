import { Types } from 'mongoose';

export class ReadingListId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): ReadingListId {
        if (!id || id.trim().length === 0) {
            throw new Error('ReadingList ID cannot be empty');
        }

        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid ReadingList ID format');
        }

        return new ReadingListId(id);
    }

    static generate(): ReadingListId {
        return new ReadingListId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    getValue(): string {
        return this.value;
    }

    equals(other: ReadingListId): boolean {
        return this.value === other.value;
    }
}
