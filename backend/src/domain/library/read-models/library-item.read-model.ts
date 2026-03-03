export interface LibraryBookSummary {
    id: string;
    title: string;
    slug: string;
    coverUrl: string;
    authorId: string;
}

export interface LibraryChapterSummary {
    id: string;
    title: string;
    slug: string;
    orderIndex: number;
}

export interface LibraryItemReadModel {
    id: string;
    userId: string;
    bookId: LibraryBookSummary;
    status: string;
    lastReadChapterId: LibraryChapterSummary | null;
    collectionIds: string[];
    createdAt: Date;
    updatedAt: Date;
}
