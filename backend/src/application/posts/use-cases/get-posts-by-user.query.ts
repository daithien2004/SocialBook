export class GetPostsByUserQuery {
    constructor(
        public readonly userId: string,
        public readonly page: number = 1,
        public readonly limit: number = 10
    ) { }
}
