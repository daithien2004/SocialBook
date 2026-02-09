export class GetFollowsQuery {
    constructor(
        public readonly userId?: string,
        public readonly targetId?: string,
        public readonly page?: number,
        public readonly limit?: number,
        public readonly sortBy?: 'createdAt' | 'updatedAt',
        public readonly order?: 'asc' | 'desc'
    ) { }
}
