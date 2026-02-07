export class AuthorName {
    private readonly value: string;

    private constructor(name: string) {
        this.value = name;
    }

    static create(name: string): AuthorName {
        if (!name || name.trim().length === 0) {
            throw new Error('Author name cannot be empty');
        }

        if (name.trim().length < 2) {
            throw new Error('Author name must be at least 2 characters long');
        }

        if (name.trim().length > 100) {
            throw new Error('Author name cannot exceed 100 characters');
        }

        return new AuthorName(name.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: AuthorName): boolean {
        return this.value.toLowerCase() === other.value.toLowerCase();
    }

    getValue(): string {
        return this.value;
    }
}
