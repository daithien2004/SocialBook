export class AuthorId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): AuthorId {
        if (!id || id.trim().length === 0) {
            throw new Error('Author ID cannot be empty');
        }
        return new AuthorId(id.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: AuthorId): boolean {
        if (!other) return false;
        return this.value === other.value;
    }
}
