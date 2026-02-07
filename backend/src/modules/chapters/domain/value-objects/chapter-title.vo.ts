export class ChapterTitle {
    private readonly value: string;

    private constructor(title: string) {
        this.value = title;
    }

    static create(title: string): ChapterTitle {
        if (!title || title.trim().length === 0) {
            throw new Error('Chapter title cannot be empty');
        }

        if (title.trim().length < 3) {
            throw new Error('Chapter title must be at least 3 characters long');
        }

        if (title.trim().length > 200) {
            throw new Error('Chapter title cannot exceed 200 characters');
        }

        return new ChapterTitle(title.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: ChapterTitle): boolean {
        return this.value.toLowerCase() === other.value.toLowerCase();
    }

    getValue(): string {
        return this.value;
    }
}
