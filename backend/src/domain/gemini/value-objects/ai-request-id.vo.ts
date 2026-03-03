export class AIRequestId {
    private constructor(private readonly _value: string) {}

    static create(value: string): AIRequestId {
        if (!value || value.trim().length === 0) {
            throw new Error('AI Request ID cannot be empty');
        }
        return new AIRequestId(value);
    }

    toString(): string {
        return this._value;
    }

    equals(other: AIRequestId): boolean {
        return this._value === other._value;
    }

    get value(): string {
        return this._value;
    }
}
