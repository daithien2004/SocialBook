export class FollowId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): FollowId {
        if (!id || id.trim().length === 0) {
            throw new Error('Follow ID cannot be empty');
        }
        return new FollowId(id.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: FollowId): boolean {
        if (!other) return false;
        return this.value === other.value;
    }
}
