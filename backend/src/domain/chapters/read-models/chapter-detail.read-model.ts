import { BookListReadModel } from '../../books/read-models/book-list.read-model';

export interface ParagraphSummary {
    id: string;
    content: string;
}

export interface ChapterDetailSummary {
    id: string;
    bookId: string;
    title: string;
    slug: string;
    orderIndex: number;
    viewsCount: number;
    paragraphs: ParagraphSummary[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ChapterNavigationSummary {
    id: string;
    title: string;
    slug: string;
    orderIndex: number;
}

export interface ChapterDetailReadModel {
    book: BookListReadModel;
    chapter: ChapterDetailSummary;
    navigation: {
        previous: ChapterNavigationSummary | null;
        next: ChapterNavigationSummary | null;
    };
}
