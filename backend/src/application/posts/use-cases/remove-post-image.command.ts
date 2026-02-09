export class RemovePostImageCommand {
    constructor(
        public readonly userId: string,
        public readonly postId: string,
        public readonly imageUrl: string,
        public readonly isAdmin: boolean = false
    ) { }
}
