export class VectorId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): VectorId {
        if (!id || id.trim().length === 0) {
            throw new Error('Vector ID cannot be empty');
        }

        return new VectorId(id.trim());
    }

    static generate(): VectorId {
        return new VectorId(Math.random().toString(36).substr(2, 9) + Date.now().toString(36));
    }

    toString(): string {
        return this.value;
    }

    equals(other: VectorId): boolean {
        return this.value === other.value;
    }
}
