import { Types } from 'mongoose';

export class PostId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): PostId {
        if (!id || id.trim().length === 0) {
            throw new Error('Post ID cannot be empty');
        }

        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Post ID format');
        }

        return new PostId(id);
    }

    static generate(): PostId {
        return new PostId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    getValue(): string {
        return this.value;
    }

    equals(other: PostId): boolean {
        return this.value === other.value;
    }
}
