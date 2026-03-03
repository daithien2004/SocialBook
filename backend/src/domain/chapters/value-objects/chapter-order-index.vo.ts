export class ChapterOrderIndex {
    private readonly value: number;

    private constructor(orderIndex: number) {
        this.value = orderIndex;
    }

    static create(orderIndex: number): ChapterOrderIndex {
        if (orderIndex < 0) {
            throw new Error('Chapter order index cannot be negative');
        }

        if (orderIndex > 9999) {
            throw new Error('Chapter order index cannot exceed 9999');
        }

        return new ChapterOrderIndex(orderIndex);
    }

    static first(): ChapterOrderIndex {
        return new ChapterOrderIndex(1);
    }

    static next(current: ChapterOrderIndex): ChapterOrderIndex {
        return new ChapterOrderIndex(current.value + 1);
    }

    toString(): string {
        return this.value.toString();
    }

    getValue(): number {
        return this.value;
    }

    equals(other: ChapterOrderIndex): boolean {
        return this.value === other.value;
    }

    isAfter(other: ChapterOrderIndex): boolean {
        return this.value > other.value;
    }

    isBefore(other: ChapterOrderIndex): boolean {
        return this.value < other.value;
    }
}
