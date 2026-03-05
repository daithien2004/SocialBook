export class GetPostsByUserQuery {
    constructor(
        public readonly userId: string,
        public readonly limit: number = 10,
        public readonly cursor?: string,  // _id của post cuối cùng đã thấy
    ) { }
}
