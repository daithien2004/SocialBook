export class UserId {
    private constructor(private readonly _value: string) {}

    static create(value: string): UserId {
        if (!value || value.trim().length === 0) {
            throw new Error('User ID cannot be empty');
        }
        return new UserId(value);
    }

    toString(): string {
        return this._value;
    }

    equals(other: UserId): boolean {
        return this._value === other._value;
    }

    get value(): string {
        return this._value;
    }
}
