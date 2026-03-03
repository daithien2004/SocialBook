export class ContentType {
    private readonly value: 'book' | 'author' | 'chapter';

    private constructor(type: 'book' | 'author' | 'chapter') {
        this.value = type;
    }

    static create(type: string): ContentType {
        const validTypes = ['book', 'author', 'chapter'];
        
        if (!type || !validTypes.includes(type)) {
            throw new Error('Content type must be book, author, or chapter');
        }

        return new ContentType(type as 'book' | 'author' | 'chapter');
    }

    static book(): ContentType {
        return new ContentType('book');
    }

    static author(): ContentType {
        return new ContentType('author');
    }

    static chapter(): ContentType {
        return new ContentType('chapter');
    }

    toString(): string {
        return this.value;
    }

    isBook(): boolean {
        return this.value === 'book';
    }

    isAuthor(): boolean {
        return this.value === 'author';
    }

    isChapter(): boolean {
        return this.value === 'chapter';
    }

    equals(other: ContentType): boolean {
        return this.value === other.value;
    }
}
