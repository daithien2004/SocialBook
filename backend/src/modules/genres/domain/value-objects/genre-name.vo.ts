export class GenreName {
    private readonly value: string;

    private constructor(name: string) {
        this.value = name;
    }

    static create(name: string): GenreName {
        if (!name || name.trim().length === 0) {
            throw new Error('Genre name cannot be empty');
        }

        const trimmed = name.trim();

        if (trimmed.length < 2) {
            throw new Error('Genre name must be at least 2 characters');
        }

        if (trimmed.length > 50) {
            throw new Error('Genre name must not exceed 50 characters');
        }

        if (!/^[\p{L}\p{N}\s-]+$/u.test(trimmed)) {
            throw new Error('Genre name contains invalid characters');
        }

        return new GenreName(trimmed);
    }

    toString(): string {
        return this.value;
    }

    equals(other: GenreName): boolean {
        return this.value.toLowerCase() === other.value.toLowerCase();
    }
}
