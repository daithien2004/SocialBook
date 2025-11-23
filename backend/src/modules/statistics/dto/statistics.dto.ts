export interface OverviewStats {
    users: {
        total: number;
        active: number;
        banned: number;
        growth: number;
    };
    books: {
        total: number;
        chapters: number;
    };
    posts: {
        total: number;
        active: number;
    };
    comments: number;
    reviews: number;
}

export interface UserStats {
    total: number;
    verified: number;
    banned: number;
    byProvider: {
        local: number;
        google: number;
        facebook: number;
    };
    recentRegistrations: Array<{
        date: string;
        count: number;
    }>;
}

export interface BookStats {
    total: number;
    totalChapters: number;
    byGenre: Array<{
        genre: string;
        count: number;
    }>;
    popularBooks: Array<{
        id: string;
        title: string;
        slug: string;
        views: number;
        likes: number;
    }>;
}

export interface PostStats {
    total: number;
    active: number;
    deleted: number;
    totalComments: number;
}

export interface GrowthMetric {
    date: string;
    users: number;
    books: number;
    posts: number;
}
