import { Types } from 'mongoose';

export class LikeId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): LikeId {
        if (!id || id.trim().length === 0) {
            throw new Error('Like ID cannot be empty');
        }

        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Like ID format');
        }

        return new LikeId(id);
    }

    static generate(): LikeId {
        return new LikeId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    getValue(): string {
        return this.value;
    }

    equals(other: LikeId): boolean {
        return this.value === other.value;
    }
}
