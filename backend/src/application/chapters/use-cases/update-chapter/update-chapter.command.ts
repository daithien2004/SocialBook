export class UpdateChapterCommand {
    constructor(
        public readonly id: string,
        public readonly title?: string,
        public readonly bookId?: string,
        public readonly paragraphs?: Array<{ id?: string; content: string }>,
        public readonly slug?: string,
        public readonly orderIndex?: number
    ) {}
}
