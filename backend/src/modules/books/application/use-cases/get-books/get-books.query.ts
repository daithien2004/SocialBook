export class GetBooksQuery {
    constructor(
        public readonly page: number = 1,
        public readonly limit: number = 10,
        public readonly title?: string,
        public readonly authorId?: string,
        public readonly genres?: string[],
        public readonly tags?: string[],
        public readonly status?: 'draft' | 'published' | 'completed',
        public readonly search?: string,
        public readonly publishedYear?: string,
        public readonly sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'views' | 'likes' | 'publishedYear',
        public readonly order?: 'asc' | 'desc'
    ) {}
}
