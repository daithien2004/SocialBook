import { ChapterDocument } from '../schemas/chapter.schema';

// Helper function to convert _id to string
const toIdString = (id: any): string => {
    if (!id) return '';
    return typeof id === 'string' ? id : id.toString();
};

export class ChapterModal {
    id: string;
    title: string;
    slug: string;
    orderIndex: number;
    viewsCount: number;
    paragraphs: { id: string; content: string }[];
    book?: { id: string; title: string; slug: string };
    bookId?: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(chapter: ChapterDocument | any) {
        this.id = toIdString(chapter._id);
        this.title = chapter.title;
        this.slug = chapter.slug;
        this.orderIndex = chapter.orderIndex;
        this.viewsCount = chapter.viewsCount || 0;
        this.createdAt = chapter.createdAt;
        this.updatedAt = chapter.updatedAt;

        // Transform paragraphs
        if (chapter.paragraphs && Array.isArray(chapter.paragraphs)) {
            this.paragraphs = chapter.paragraphs.map((p: any) => ({
                id: toIdString(p._id),
                content: p.content,
            }));
        } else {
            this.paragraphs = [];
        }

        // Handle populated book (can be object or ObjectId)
        if (chapter.bookId && typeof chapter.bookId === 'object' && chapter.bookId.title) {
            this.book = {
                id: toIdString(chapter.bookId._id),
                title: chapter.bookId.title,
                slug: chapter.bookId.slug,
            };
            this.bookId = this.book.id;
        } else if (chapter.bookId) {
            this.bookId = toIdString(chapter.bookId);
        }
    }

    static fromArray(chapters: (ChapterDocument | any)[]): ChapterModal[] {
        return chapters.map(chapter => new ChapterModal(chapter));
    }
}

// For list view (minimal data, no paragraphs)
export class ChapterListModal {
    id: string;
    title: string;
    slug: string;
    orderIndex: number;
    viewsCount: number;

    constructor(chapter: ChapterDocument | any) {
        this.id = toIdString(chapter._id);
        this.title = chapter.title;
        this.slug = chapter.slug;
        this.orderIndex = chapter.orderIndex;
        this.viewsCount = chapter.viewsCount || 0;
    }

    static fromArray(chapters: (ChapterDocument | any)[]): ChapterListModal[] {
        return chapters.map(chapter => new ChapterListModal(chapter));
    }
}

// For navigation (prev/next)
export class ChapterNavModal {
    id: string;
    title: string;
    slug: string;
    orderIndex: number;

    constructor(chapter: ChapterDocument | any) {
        this.id = toIdString(chapter._id);
        this.title = chapter.title;
        this.slug = chapter.slug;
        this.orderIndex = chapter.orderIndex;
    }

    static fromChapter(chapter: ChapterDocument | any | null): ChapterNavModal | null {
        if (!chapter) return null;
        return new ChapterNavModal(chapter);
    }
}
