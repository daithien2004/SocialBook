export class UpdatePostCommand {
    constructor(
        public readonly userId: string,
        public readonly postId: string,
        public readonly content?: string,
        public readonly bookId?: string,
        public readonly imageUrls?: string[]
    ) { }
}
