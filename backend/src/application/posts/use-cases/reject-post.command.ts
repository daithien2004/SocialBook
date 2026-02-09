export class RejectPostCommand {
    constructor(
        public readonly postId: string,
        public readonly reason: string
    ) { }
}
