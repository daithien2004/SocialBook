export class CommentId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): CommentId {
        if (!id || id.trim().length === 0) {
            throw new Error('Comment ID cannot be empty');
        }
        return new CommentId(id.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: CommentId): boolean {
        if (!other) return false;
        return this.value === other.value;
    }
}
