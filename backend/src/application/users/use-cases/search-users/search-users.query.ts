export class SearchUsersQuery {
    constructor(
        public readonly query: string,
        public readonly page?: number,
        public readonly limit?: number
    ) { }
}
