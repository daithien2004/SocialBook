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
    genres: GenreSummary[];
    description: string;
    publishedYear: string;
    coverUrl: string;
    status: string;
    tags: string[];
    likedBy: string[];
    stats: {
        views: number;
        likes: number;
        chapterCount: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
