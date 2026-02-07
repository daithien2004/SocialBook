export class TargetId {
    private constructor(private readonly _value: string) {}

    static create(value: string): TargetId {
        if (!value || value.trim().length === 0) {
            throw new Error('Target ID cannot be empty');
        }
        return new TargetId(value);
    }

    toString(): string {
        return this._value;
    }

    equals(other: TargetId): boolean {
        return this._value === other._value;
    }

    get value(): string {
        return this._value;
    }
}
