export class GetChaptersQuery {
    constructor(
        public readonly page: number = 1,
        public readonly limit: number = 10,
        public readonly title?: string,
        public readonly bookId?: string,
        public readonly bookSlug?: string,
        public readonly orderIndex?: number,
        public readonly minWordCount?: number,
        public readonly maxWordCount?: number,
        public readonly sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'orderIndex' | 'viewsCount',
        public readonly order?: 'asc' | 'desc'
    ) {}
}
