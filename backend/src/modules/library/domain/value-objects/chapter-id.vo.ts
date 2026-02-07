export class ChapterId {
    private constructor(private readonly _value: string) {}

    static create(value: string): ChapterId {
        if (!value || value.trim().length === 0) {
            throw new Error('Chapter ID cannot be empty');
        }
        return new ChapterId(value);
    }

    toString(): string {
        return this._value;
    }

    equals(other: ChapterId): boolean {
        return this._value === other._value;
    }

    get value(): string {
        return this._value;
    }
}
