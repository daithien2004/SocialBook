export class GetCommentsQuery {
    constructor(
        public readonly targetId: string,
        public readonly parentId?: string | null,
        public readonly page?: number,
        public readonly limit?: number,
        public readonly cursor?: string,
        public readonly sortBy?: 'createdAt' | 'updatedAt' | 'likesCount',
        public readonly order?: 'asc' | 'desc'
    ) { }
}
