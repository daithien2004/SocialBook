export class ChapterId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): ChapterId {
        if (!id || id.trim().length === 0) {
            throw new Error('Chapter ID cannot be empty');
        }
        return new ChapterId(id.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: ChapterId): boolean {
        if (!other) return false;
        return this.value === other.value;
    }
}
