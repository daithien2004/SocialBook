export class CommentContent {
    private readonly value: string;

    private constructor(content: string) {
        this.value = content;
    }

    static create(content: string): CommentContent {
        if (!content || content.trim().length === 0) {
            throw new Error('Comment content cannot be empty');
        }

        if (content.trim().length > 2000) {
            throw new Error('Comment content cannot exceed 2000 characters');
        }

        return new CommentContent(content.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: CommentContent): boolean {
        return this.value === other.value;
    }

    getValue(): string {
        return this.value;
    }

    getWordCount(): number {
        return this.value.split(/\s+/).filter(word => word.length > 0).length;
    }

    getCharacterCount(): number {
        return this.value.length;
    }

    getPreview(maxLength: number = 200): string {
        if (this.value.length <= maxLength) {
            return this.value;
        }
        return this.value.substring(0, maxLength) + '...';
    }

    isEmpty(): boolean {
        return this.value.trim().length === 0;
    }

    updateContent(newContent: string): CommentContent {
        return CommentContent.create(newContent);
    }
}
