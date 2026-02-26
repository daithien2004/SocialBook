export class GenreId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): GenreId {
        if (!id || id.trim().length === 0) {
            throw new Error('Genre ID cannot be empty');
        }
        return new GenreId(id.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: GenreId): boolean {
        if (!other) return false;
        return this.value === other.value;
    }
}
