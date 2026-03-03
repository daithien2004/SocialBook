export class CreatePostCommand {
    constructor(
        public readonly userId: string,
        public readonly bookId: string,
        public readonly content: string
    ) { }
}
