export class TargetId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): TargetId {
        if (!id || id.trim().length === 0) {
            throw new Error('Target ID cannot be empty');
        }
        return new TargetId(id.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: TargetId): boolean {
        if (!other) return false;
        return this.value === other.value;
    }

    getValue(): string {
        return this.value;
    }
}
