export class GetGenresQuery {
    constructor(
        public readonly page: number = 1,
        public readonly limit: number = 10,
        public readonly name?: string
    ) {}
}
