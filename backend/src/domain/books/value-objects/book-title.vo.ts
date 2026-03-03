export class BookTitle {
    private readonly value: string;

    private constructor(title: string) {
        this.value = title;
    }

    static create(title: string): BookTitle {
        if (!title || title.trim().length === 0) {
            throw new Error('Book title cannot be empty');
        }

        if (title.trim().length < 5) {
            throw new Error('Book title must be at least 5 characters long');
        }

        if (title.trim().length > 200) {
            throw new Error('Book title cannot exceed 200 characters');
        }

        return new BookTitle(title.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: BookTitle): boolean {
        return this.value.toLowerCase() === other.value.toLowerCase();
    }

    getValue(): string {
        return this.value;
    }
}
