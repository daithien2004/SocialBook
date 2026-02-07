export enum TargetType {
    BOOK = 'book',
    CHAPTER = 'chapter',
    POST = 'post',
    AUTHOR = 'author'
}

export class CommentTargetType {
    private readonly value: TargetType;

    private constructor(type: TargetType) {
        this.value = type;
    }

    static create(type: string): CommentTargetType {
        const validTypes = Object.values(TargetType);
        
        if (!type || !validTypes.includes(type as TargetType)) {
            throw new Error(`Target type must be one of: ${validTypes.join(', ')}`);
        }

        return new CommentTargetType(type as TargetType);
    }

    static book(): CommentTargetType {
        return new CommentTargetType(TargetType.BOOK);
    }

    static chapter(): CommentTargetType {
        return new CommentTargetType(TargetType.CHAPTER);
    }

    static post(): CommentTargetType {
        return new CommentTargetType(TargetType.POST);
    }

    static author(): CommentTargetType {
        return new CommentTargetType(TargetType.AUTHOR);
    }

    toString(): string {
        return this.value;
    }

    isBook(): boolean {
        return this.value === TargetType.BOOK;
    }

    isChapter(): boolean {
        return this.value === TargetType.CHAPTER;
    }

    isPost(): boolean {
        return this.value === TargetType.POST;
    }

    isAuthor(): boolean {
        return this.value === TargetType.AUTHOR;
    }

    equals(other: CommentTargetType): boolean {
        return this.value === other.value;
    }
}
