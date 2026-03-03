export interface ChapterSummary {
    id: string;
    title: string;
    slug: string;
    orderIndex: number;
    viewsCount: number;
    paragraphsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface BookSummary {
    id: string;
    title: string;
    slug: string;
    coverUrl: string;
    authorId: string;
}

export interface ChapterListReadModel {
    book: BookSummary;
    chapters: ChapterSummary[];
    total: number;
}
