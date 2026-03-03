export class BookId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): BookId {
        if (!id || id.trim().length === 0) {
            throw new Error('Book ID cannot be empty');
        }
        return new BookId(id.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: BookId): boolean {
        if (!other) return false;
        return this.value === other.value;
    }
}
