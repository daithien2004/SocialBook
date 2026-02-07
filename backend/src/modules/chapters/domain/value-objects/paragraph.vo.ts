export class Paragraph {
    private constructor(
        public readonly id: string,
        private _content: string
    ) {}

    static create(id: string, content: string): Paragraph {
        if (!id || id.trim().length === 0) {
            throw new Error('Paragraph ID cannot be empty');
        }

        if (!content || content.trim().length === 0) {
            throw new Error('Paragraph content cannot be empty');
        }

        return new Paragraph(id.trim(), content.trim());
    }

    static createWithoutId(content: string): Paragraph {
        const id = this.generateId();
        return new Paragraph(id, content.trim());
    }

    get content(): string {
        return this._content;
    }

    updateContent(newContent: string): void {
        if (!newContent || newContent.trim().length === 0) {
            throw new Error('Paragraph content cannot be empty');
        }
        this._content = newContent.trim();
    }

    private static generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    toString(): string {
        return this._content;
    }

    equals(other: Paragraph): boolean {
        return this.id === other.id && this._content === other._content;
    }
}
