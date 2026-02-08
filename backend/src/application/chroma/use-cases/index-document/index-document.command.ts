export class IndexDocumentCommand {
    constructor(
        public readonly contentId: string,
        public readonly contentType: 'book' | 'author' | 'chapter',
        public readonly content: string,
        public readonly metadata?: Record<string, any>,
        public readonly embedding?: number[]
    ) {}
}
