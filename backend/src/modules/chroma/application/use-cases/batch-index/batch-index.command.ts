export class BatchIndexCommand {
    constructor(
        public readonly contentIds: string[],
        public readonly contentType: 'book' | 'author' | 'chapter',
        public readonly forceReindex?: boolean
    ) {}
}
