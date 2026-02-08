export class BookId {
    private constructor(private readonly _value: string) {}

    static create(value: string): BookId {
        if (!value || value.trim().length === 0) {
            throw new Error('Book ID cannot be empty');
        }
        return new BookId(value);
    }

    toString(): string {
        return this._value;
    }

    equals(other: BookId): boolean {
        return this._value === other._value;
    }

    get value(): string {
        return this._value;
    }
}
