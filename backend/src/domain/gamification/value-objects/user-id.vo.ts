export class UserId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): UserId {
        if (!id || id.trim().length === 0) {
            throw new Error('User ID cannot be empty');
        }
        return new UserId(id.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: UserId): boolean {
        if (!other) return false;
        return this.value === other.value;
    }

    getValue(): string {
        return this.value;
    }
}
