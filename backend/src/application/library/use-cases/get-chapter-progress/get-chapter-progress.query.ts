export class GetChapterProgressQuery {
    constructor(
        public readonly userId: string,
        public readonly bookId: string,
        public readonly chapterId: string
    ) { }
}
