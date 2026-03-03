export class CreateBookCommand {
    constructor(
        public readonly title: string,
        public readonly authorId: string,
        public readonly genres: string[],
        public readonly description?: string,
        public readonly publishedYear?: string,
        public readonly coverUrl?: string,
        public readonly status?: 'draft' | 'published' | 'completed',
        public readonly tags?: string[]
    ) {}
}
