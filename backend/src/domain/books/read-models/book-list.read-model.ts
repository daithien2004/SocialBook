export interface GenreSummary {
    id: string;
    name: string;
    slug: string;
}

export interface BookListReadModel {
    id: string;
    title: string;
    slug: string;
    authorId: string;
    authorName?: string;
    genres: GenreSummary[];
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
    chapterCount?: number;
}
