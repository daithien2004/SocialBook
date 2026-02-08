export class SearchCommand {
    constructor(
        public readonly query: string,
        public readonly contentType?: 'book' | 'author' | 'chapter',
        public readonly filters?: Record<string, any>,
        public readonly limit?: number,
        public readonly threshold?: number,
        public readonly embedding?: number[]
    ) {}
}
