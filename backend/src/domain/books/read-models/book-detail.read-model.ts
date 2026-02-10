export interface ChapterSummary {
    id: string;
    title: string;
    slug: string;
    content: string;
    orderIndex: number;
    viewsCount: number;
    createdAt: Date;
    updatedAt?: Date;
}

export interface BookDetailReadModel {
    id: string;
    title: string;
    slug: string;
    authorId: string;
    genres: { id: string; name: string; slug: string }[];
    description: string;
    publishedYear: string;
    coverUrl: string;
    status: string;
    tags: string[];
    views: number;
    likes: number;
    likedBy: string[];
    createdAt: Date;
    updatedAt: Date;
    chapters: ChapterSummary[];
}
